import { getAgentProvider } from "./provider";
import type { AgentProvider, ProviderResponse } from "./provider";
import { evaluateProducts, EVALUATION_WEIGHTS } from "./evaluation";
import { executeShoppingTool, type ToolExecutionResult } from "./tools";
import type {
  AgentRecommendation,
  AgentTimingDiagnostics,
  ConversationMessage,
  ProductEvaluation,
  ShoppingAgentResponse,
  ShoppingIntent,
} from "./types";
import { resolveIntentBudget, validateIntent, validateToolArguments } from "./validation";
import { searchProducts } from "@/lib/channel3/service";
import type { Product } from "@/types/product";

const MAX_TOOL_TURNS = 3;
const MAX_REQUEST_MS = 75_000;
const MAX_MODEL_PRODUCTS = 8;
const SYSTEM_INSTRUCTION = `You are CartPilot, a shopping agent for a live commerce catalog.
Use only the two supplied tools to access products. Never invent product IDs, prices, merchants, ratings, availability, or specifications.
The application evaluates products deterministically. Treat its evaluation, scores, evidence, unknowns, and trade-offs as authoritative; explain them without changing scores or adding unsupported claims.
Ask a concise clarification question only when an essential shopping requirement is genuinely missing. If you have enough information, search the live Channel3 catalog.
At the end, give a concise recommendation grounded in the supplied products and evaluations. Do not call a tool again when the supplied results are sufficient.`;

interface TimingState {
  startedAt: number;
  diagnostics: AgentTimingDiagnostics;
}

function elapsed(startedAt: number) {
  return Math.round(performance.now() - startedAt);
}

function markStage(timing: TimingState, key: keyof Omit<AgentTimingDiagnostics, "totalMs" | "geminiCallCount" | "channel3CallCount">, startedAt: number) {
  timing.diagnostics[key] = (timing.diagnostics[key] ?? 0) + elapsed(startedAt);
}

function remainingMs(timing: TimingState) {
  return Math.max(1, MAX_REQUEST_MS - elapsed(timing.startedAt));
}

async function withRequestDeadline<T>(promise: Promise<T>, timing: TimingState): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Shopping agent request timed out.")), remainingMs(timing));
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function parseIntentOutput(text: string | undefined, provider: AgentProvider): ShoppingIntent {
  if (!text) throw new Error(`${provider.name} did not return a shopping intent.`);
  return validateIntent(JSON.parse(text));
}

function compactProduct(product: Product) {
  return {
    id: product.id,
    title: product.title,
    category: product.category,
    merchant: product.merchant,
    price: product.price,
    rating: product.rating,
    reviewCount: product.reviewCount,
    features: product.features?.slice(0, 12),
    specifications: Object.fromEntries(Object.entries(product.specifications).slice(0, 20)),
  };
}

function recommendationOutput(
  products: Product[],
  evaluations: ProductEvaluation[],
  intent: ShoppingIntent,
  explanation: string,
  mode: "ai" | "deterministic",
  toolCalls: string[],
  timing: TimingState,
  interactionId?: string,
): ShoppingAgentResponse {
  const recommendations: AgentRecommendation[] = evaluations.slice(0, 3).map((evaluation, index) => ({
    productId: evaluation.productId,
    rank: index + 1,
    reasons: [
      `Application score: ${evaluation.score}/${Object.values(EVALUATION_WEIGHTS).reduce((sum, weight) => sum + weight, 0)}.`,
      ...evaluation.requiredFeatureMatches.map((item) => `Matches ${item}.`),
      ...evaluation.preferenceMatches.map((item) => `Matches preference: ${item}.`),
    ],
    tradeoffs: evaluation.tradeoffs,
    evidence: evaluation.evidence,
  }));
  timing.diagnostics.totalMs = elapsed(timing.startedAt);
  return {
    mode,
    status: products.length ? "recommendations" : "empty",
    message: explanation.trim() || "These live products were ranked using the application evaluation.",
    intent,
    products,
    evaluations,
    recommendations,
    ...(interactionId ? { interactionId } : {}),
    toolCalls,
    diagnostics: timing.diagnostics,
  };
}

async function deterministicFallback(
  message: string,
  errorMessage: string,
  timing: TimingState,
  existingProducts: Product[] = [],
  existingEvaluations?: ProductEvaluation[],
  allowSearch = true,
): Promise<ShoppingAgentResponse> {
  let products = existingProducts;
  if (!products.length && allowSearch) {
    const startedAt = performance.now();
    const result = await withRequestDeadline(searchProducts({ query: message }), timing);
    markStage(timing, "channel3SearchMs", startedAt);
    timing.diagnostics.channel3CallCount += 1;
    products = result.products;
  }
  const intent = resolveIntentBudget(
    { requiredFeatures: [], preferences: [], missingRequirements: [] },
    message,
  );
  const startedAt = performance.now();
  const evaluations = existingEvaluations ?? evaluateProducts(products, intent);
  if (!existingEvaluations) markStage(timing, "evaluationMs", startedAt);
  return recommendationOutput(
    products,
    evaluations,
    intent,
    `${errorMessage} Showing a deterministic live Channel3 shortlist; these are not AI-generated recommendations.`,
    "deterministic",
    ["search_products"],
    timing,
  );
}

async function createProviderResponse(
  operation: () => Promise<ProviderResponse>,
  timing: TimingState,
): Promise<ProviderResponse> {
  timing.diagnostics.geminiCallCount += 1;
  return withRequestDeadline(operation(), timing);
}

export async function runShoppingAgent(message: string, history: ConversationMessage[] = []): Promise<ShoppingAgentResponse> {
  const timing: TimingState = {
    startedAt: performance.now(),
    diagnostics: { totalMs: 0, geminiCallCount: 0, channel3CallCount: 0 },
  };
  let provider: AgentProvider;
  try {
    provider = getAgentProvider();
  } catch (error) {
    return deterministicFallback(message, error instanceof Error ? error.message : "The AI provider is unavailable.", timing);
  }

  const productsById = new Map<string, Product>();
  let evaluations: ProductEvaluation[] | undefined;
  try {
    const context = history.slice(-6).map((item) => `${item.role}: ${item.content}`).join("\n");
    const intentStartedAt = performance.now();
    let intentInteraction: ProviderResponse;
    try {
      intentInteraction = await createProviderResponse(
        () => provider.extractIntent(`${context ? `${context}\n` : ""}User request: ${message}`),
        timing,
      );
    } finally {
      markStage(timing, "intentExtractionMs", intentStartedAt);
    }
    const intent = resolveIntentBudget(parseIntentOutput(intentInteraction.outputText, provider), message);
    if (intent.missingRequirements.length) {
      return recommendationOutput([], [], intent, "I need one more detail before searching the live catalog.", "ai", [], timing, intentInteraction.id);
    }

    const toolGenerationStartedAt = performance.now();
    let interaction: ProviderResponse;
    try {
      interaction = await createProviderResponse(
        () => provider.requestTools(`${SYSTEM_INSTRUCTION}\nIntent: ${JSON.stringify(intent)}\nUser request: ${message}`),
        timing,
      );
    } finally {
      markStage(timing, "toolCallGenerationMs", toolGenerationStartedAt);
    }
    const toolCache = new Map<string, ToolExecutionResult>();
    const toolCalls: string[] = [];

    for (let turn = 0; turn < MAX_TOOL_TURNS; turn += 1) {
      const calls = interaction.toolCalls;
      if (!calls.length) {
        const products = [...productsById.values()];
        const evaluationStartedAt = performance.now();
        evaluations = evaluateProducts(products, intent);
        markStage(timing, "evaluationMs", evaluationStartedAt);
        return recommendationOutput(products, evaluations, intent, interaction.outputText ?? "", "ai", toolCalls, timing, interaction.id);
      }
      const results: { id: string; name: string; result: string }[] = [];
      for (const call of calls) {
        if (call.name !== "search_products" && call.name !== "get_product_details") {
          throw new Error(`${provider.name} requested an unsupported tool.`);
        }
        if (call.name === "get_product_details") {
          const detailArguments = validateToolArguments(call.name, call.arguments);
          const unknownId = (detailArguments.productIds as string[]).find((id) => !productsById.has(id));
          if (unknownId) throw new Error("Gemini requested details for a product that was not returned by Channel3 search.");
        }
        const result = await executeShoppingTool(call.name, call.arguments, toolCache);
        if (result.source === "channel3") {
          timing.diagnostics.channel3CallCount += 1;
          if (call.name === "search_products") timing.diagnostics.channel3SearchMs = (timing.diagnostics.channel3SearchMs ?? 0) + result.durationMs;
          if (call.name === "get_product_details") timing.diagnostics.productDetailMs = (timing.diagnostics.productDetailMs ?? 0) + result.durationMs;
        }
        toolCalls.push(call.name);
        result.data.products.forEach((product) => productsById.set(product.id, product));
        const evaluationStartedAt = performance.now();
        evaluations = evaluateProducts([...productsById.values()], intent);
        markStage(timing, "evaluationMs", evaluationStartedAt);
        results.push({
          id: call.id,
          name: call.name,
          result: JSON.stringify({
            products: [...productsById.values()].slice(0, MAX_MODEL_PRODUCTS).map(compactProduct),
            evaluations: evaluations.slice(0, MAX_MODEL_PRODUCTS),
            scoring: EVALUATION_WEIGHTS,
          }),
        });
      }
      const finalExplanationStartedAt = performance.now();
      interaction = await createProviderResponse(
        () => provider.continueWithToolResults(interaction, results),
        timing,
      );
      markStage(timing, "finalExplanationMs", finalExplanationStartedAt);
    }
    throw new Error("Gemini exceeded the maximum tool-call turns.");
  } catch (error) {
    const safeMessage = error instanceof Error ? error.message : "Gemini could not complete the request.";
    return deterministicFallback(
      message,
      safeMessage,
      timing,
      [...productsById.values()],
      evaluations,
      timing.diagnostics.channel3CallCount === 0,
    );
  }
}
