import { GoogleGenAI } from "@google/genai";

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
export const GEMINI_REQUEST_TIMEOUT_MS = 20_000;

export const shoppingIntentSchema = {
  type: "object",
  properties: {
    category: { type: "string" },
    budget: {
      type: "object",
      properties: {
        amount: { type: "number" },
        currency: { type: "string" },
        isMaximum: { type: "boolean" },
      },
      required: ["amount", "currency", "isMaximum"],
    },
    requiredFeatures: { type: "array", items: { type: "string" } },
    preferences: { type: "array", items: { type: "string" } },
    useCase: { type: "string" },
    missingRequirements: { type: "array", items: { type: "string" } },
  },
  required: ["requiredFeatures", "preferences", "missingRequirements"],
} as const;

export function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  return new GoogleGenAI({ apiKey });
}

export function getGeminiRequestOptions() {
  return {
    timeout_ms: GEMINI_REQUEST_TIMEOUT_MS,
    retries: { strategy: "none" as const },
  };
}
