import type { Product } from "@/types/product";

export interface ShoppingIntent {
  category?: string;
  budget?: {
    amount: number;
    currency: string;
    isMaximum: boolean;
  };
  requiredFeatures: string[];
  preferences: string[];
  useCase?: string;
  missingRequirements: string[];
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ProductEvaluation {
  productId: string;
  requiredFeatureMatches: string[];
  unmetRequirements: string[];
  unknownSpecifications: string[];
  budgetFit: "within" | "over" | "unknown" | "currency-mismatch";
  preferenceMatches: string[];
  dataCompleteness: number;
  tradeoffs: string[];
  score: number;
  evidence: string[];
}

export interface AgentRecommendation {
  productId: string;
  rank: number;
  reasons: string[];
  tradeoffs: string[];
  evidence: string[];
}

export interface ShoppingAgentResponse {
  mode: "ai" | "deterministic";
  status: "recommendations" | "clarification" | "empty" | "error";
  message: string;
  intent: ShoppingIntent;
  clarificationQuestion?: string;
  products: Product[];
  evaluations: ProductEvaluation[];
  recommendations: AgentRecommendation[];
  interactionId?: string;
  toolCalls: string[];
  diagnostics?: AgentTimingDiagnostics;
}

export interface AgentTimingDiagnostics {
  intentExtractionMs?: number;
  toolCallGenerationMs?: number;
  channel3SearchMs?: number;
  productDetailMs?: number;
  evaluationMs?: number;
  finalExplanationMs?: number;
  totalMs: number;
  geminiCallCount: number;
  channel3CallCount: number;
}

export interface ShoppingAgentRequest {
  message: string;
  history?: ConversationMessage[];
}
