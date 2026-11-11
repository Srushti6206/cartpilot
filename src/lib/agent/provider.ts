import { getGeminiClient, getGeminiModel, getGeminiRequestOptions, shoppingIntentSchema } from "./gemini";
import type { Interactions } from "@google/genai";
import { shoppingToolDeclarations } from "./tools";
import { getGroqProvider } from "./groq";

export interface ProviderToolCall {
  id: string;
  name: string;
  arguments: unknown;
}

export interface ProviderResponse {
  id: string;
  outputText?: string;
  toolCalls: ProviderToolCall[];
}

export interface ProviderToolResult {
  id: string;
  name: string;
  result: string;
}

export interface AgentProvider {
  name: "groq" | "gemini";
  model: string;
  extractIntent(input: string): Promise<ProviderResponse>;
  requestTools(input: string): Promise<ProviderResponse>;
  continueWithToolResults(response: ProviderResponse, results: ProviderToolResult[]): Promise<ProviderResponse>;
}

export function getAgentProvider(): AgentProvider {
  if (process.env.GROQ_API_KEY?.trim()) {
    // Provider failures are handled by the orchestrator; they do not switch providers.
    return getGroqProvider();
  }
  return getGeminiProvider();
}

export function getGeminiProvider(): AgentProvider {
  const client = getGeminiClient();
  const model = getGeminiModel();

  async function create(
    params: Interactions.CreateModelInteractionParamsNonStreaming,
  ): Promise<ProviderResponse> {
    const response = await client.interactions.create(params, getGeminiRequestOptions());
    if (!("steps" in response) || !("id" in response)) {
      throw new Error("Gemini returned an unsupported interaction response.");
    }
    const toolCalls = (response.steps ?? [])
      .filter((step): step is Interactions.FunctionCallStep => step.type === "function_call")
      .map((call) => ({ id: call.id, name: call.name, arguments: call.arguments }));
    return { id: response.id, outputText: response.output_text ?? undefined, toolCalls };
  }

  return {
    name: "gemini",
    model,
    extractIntent: (input) => create({
      model,
      input,
      system_instruction: "Extract a shopping intent as JSON only. Use uppercase ISO 4217 currency codes. Do not invent missing requirements.",
      response_format: { type: "text", mime_type: "application/json", schema: shoppingIntentSchema },
    }),
    requestTools: (input) => create({
      model,
      input,
      system_instruction: "Use the supplied tools to search live products. Never invent product data.",
      tools: [...shoppingToolDeclarations],
    }),
    continueWithToolResults: (response, results) => create({
      model,
      previous_interaction_id: response.id,
      input: results.map((item) => ({
        type: "function_result",
        call_id: item.id,
        name: item.name,
        result: item.result,
      })),
      system_instruction: "Explain the validated products and evaluations without changing scores or adding unsupported claims.",
      tools: [...shoppingToolDeclarations],
    }),
  };
}
