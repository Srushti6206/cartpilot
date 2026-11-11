import { shoppingToolDeclarations } from "./tools";
import type { AgentProvider, ProviderResponse, ProviderToolCall } from "./provider";

export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";
export const GROQ_REQUEST_TIMEOUT_MS = 20_000;
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

type GroqMessage = Record<string, unknown>;

function getGroqModel() {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

function parseToolCalls(value: unknown): ProviderToolCall[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const call = item as { id?: unknown; function?: { name?: unknown; arguments?: unknown } };
    if (typeof call.id !== "string" || !call.function || typeof call.function.name !== "string") {
      throw new Error("Groq returned an invalid tool call.");
    }
    if (typeof call.function.arguments !== "string") {
      throw new Error("Groq returned tool arguments in an unsupported format.");
    }
    let args: unknown;
    try {
      args = JSON.parse(call.function.arguments);
    } catch {
      throw new Error("Groq returned malformed tool arguments.");
    }
    return [{ id: call.id, name: call.function.name, arguments: args }];
  });
}

export function normalizeGroqResponse(value: unknown): ProviderResponse {
  if (!value || typeof value !== "object") throw new Error("Groq returned an invalid response.");
  const body = value as { id?: unknown; choices?: unknown };
  const choice = Array.isArray(body.choices) ? body.choices[0] : undefined;
  if (!choice || typeof choice !== "object" || typeof body.id !== "string") {
    throw new Error("Groq returned an incomplete response.");
  }
  const message = (choice as { message?: unknown }).message;
  if (!message || typeof message !== "object") throw new Error("Groq returned an invalid message.");
  const content = (message as { content?: unknown }).content;
  return {
    id: body.id,
    outputText: typeof content === "string" && content.length ? content : undefined,
    toolCalls: parseToolCalls((message as { tool_calls?: unknown }).tool_calls),
  };
}

async function request(model: string, messages: GroqMessage[], options: Record<string, unknown> = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model,
        messages,
        max_completion_tokens: 1024,
        reasoning_effort: "low",
        include_reasoning: false,
        temperature: 0,
        ...options,
      }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => undefined);
    if (!response.ok) {
      const error = body && typeof body === "object" && "error" in body ? (body as { error?: { message?: unknown } }).error : undefined;
      throw new Error(`Groq request failed (${response.status}): ${typeof error?.message === "string" ? error.message.slice(0, 200) : "provider error"}`);
    }
    return body;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("Groq request timed out.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function getGroqProvider(): AgentProvider {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured.");
  const model = getGroqModel();
  const baseMessages: GroqMessage[] = [];

  return {
    name: "groq",
    model,
    async extractIntent(input) {
      baseMessages.push(
        {
          role: "system",
          content: [
            "Return exactly one valid JSON object and no markdown.",
            'Use this shape: {"category":"string if known","budget":{"amount":0,"currency":"USD","isMaximum":true},"requiredFeatures":["string"],"preferences":["string"],"useCase":"string if known","missingRequirements":["string"]}.',
            "Omit category, budget, and useCase when unknown. Budget amount must be a JSON number, currency must be an uppercase ISO 4217 code, and isMaximum must be boolean.",
            "Use empty arrays when there are no required features, preferences, or missing requirements. Do not invent missing requirements.",
          ].join(" "),
        },
        { role: "user", content: input },
      );
      return normalizeGroqResponse(await request(model, baseMessages, { response_format: { type: "json_object" } }));
    },
    async requestTools(input) {
      baseMessages.push(
        { role: "user", content: input },
      );
      return normalizeGroqResponse(await request(model, baseMessages, {
        tools: shoppingToolDeclarations.map((tool) => ({
          type: "function",
          function: { name: tool.name, description: tool.description, parameters: tool.parameters },
        })),
        tool_choice: "auto",
      }));
    },
    async continueWithToolResults(response, results) {
      const assistantMessage: GroqMessage = {
        role: "assistant",
        tool_calls: response.toolCalls.map((call) => ({
          id: call.id,
          type: "function",
          function: { name: call.name, arguments: JSON.stringify(call.arguments) },
        })),
        ...(response.outputText ? { content: response.outputText } : { content: null }),
      };
      baseMessages.push(assistantMessage, ...results.map((result) => ({
        role: "tool",
        tool_call_id: result.id,
        name: result.name,
        content: result.result,
      })));
      return normalizeGroqResponse(await request(model, baseMessages, {
        tools: shoppingToolDeclarations.map((tool) => ({
          type: "function",
          function: { name: tool.name, description: tool.description, parameters: tool.parameters },
        })),
        tool_choice: "auto",
      }));
    },
  };
}
