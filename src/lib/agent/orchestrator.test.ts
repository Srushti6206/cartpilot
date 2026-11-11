import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./provider", () => ({
  getAgentProvider: vi.fn(),
}));
vi.mock("@/lib/channel3/service", () => ({
  searchProducts: vi.fn(),
  getProduct: vi.fn(),
}));

import { getAgentProvider } from "./provider";
import { searchProducts } from "@/lib/channel3/service";
import { runShoppingAgent } from "./orchestrator";

const product = {
  id: "p-1",
  title: "Headphones",
  source: "channel3" as const,
  price: { amount: 50, currency: "USD" },
  merchant: "Merchant",
  category: "Headphones",
  imageUrl: "https://example.com/image.jpg",
  features: ["Bluetooth"],
  specifications: {},
};

describe("shopping agent orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchProducts).mockResolvedValue({ products: [product], nextPageToken: null });
  });

  it("executes a bounded verified search tool call and returns grounded products", async () => {
    const provider = {
      name: "groq" as const,
      model: "openai/gpt-oss-20b",
      extractIntent: vi.fn().mockResolvedValueOnce({
        id: "intent-1",
        output_text: JSON.stringify({ category: "Headphones", requiredFeatures: [], preferences: [], missingRequirements: [] }),
        outputText: JSON.stringify({ category: "Headphones", requiredFeatures: [], preferences: [], missingRequirements: [] }),
        toolCalls: [],
      }),
      requestTools: vi.fn().mockResolvedValueOnce({
        id: "search-1",
        toolCalls: [{ id: "call-1", name: "search_products", arguments: { query: "headphones" } }],
      }),
      continueWithToolResults: vi.fn().mockResolvedValueOnce({
        id: "final-1",
        outputText: "This live result fits the request.",
        toolCalls: [],
      }),
    };
    vi.mocked(getAgentProvider).mockReturnValue(provider);

    const response = await runShoppingAgent("Find headphones");
    expect(response.mode).toBe("ai");
    expect(response.products.map((item) => item.id)).toEqual(["p-1"]);
    expect(response.toolCalls).toEqual(["search_products"]);
    expect(response.recommendations[0].productId).toBe("p-1");
    expect(provider.extractIntent).toHaveBeenCalledTimes(1);
    expect(provider.requestTools).toHaveBeenCalledTimes(1);
    expect(provider.continueWithToolResults).toHaveBeenCalledTimes(1);
    expect(response.diagnostics?.geminiCallCount).toBe(3);
    expect(response.diagnostics?.channel3CallCount).toBe(1);
  });

  it("uses the resolved request budget for tool context, evaluation, and response", async () => {
    const provider = {
      name: "groq" as const,
      model: "openai/gpt-oss-20b",
      extractIntent: vi.fn().mockResolvedValueOnce({
        id: "intent-2",
        outputText: JSON.stringify({ category: "Headphones", budget: { amount: 200, currency: "USD", isMaximum: true }, requiredFeatures: [], preferences: [], missingRequirements: [] }),
        toolCalls: [],
      }),
      requestTools: vi.fn().mockResolvedValueOnce({
        id: "search-2",
        toolCalls: [{ id: "call-2", name: "search_products", arguments: { query: "headphones" } }],
      }),
      continueWithToolResults: vi.fn().mockResolvedValueOnce({ id: "final-2", outputText: "A grounded result.", toolCalls: [] }),
    };
    vi.mocked(getAgentProvider).mockReturnValue(provider);

    const response = await runShoppingAgent("User request:\nFind headphones under $100.\nSelected preset budget: Under $200.");

    expect(response.intent.budget).toEqual({ amount: 100, currency: "USD", isMaximum: true });
    expect(provider.requestTools.mock.calls[0][0]).toContain('"amount":100');
    expect(response.evaluations[0].budgetFit).toBe("within");
  });
});
