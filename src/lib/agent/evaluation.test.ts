import { describe, expect, it } from "vitest";
import { evaluateProduct, evaluateProducts, EVALUATION_WEIGHTS } from "./evaluation";
import type { Product } from "@/types/product";
import type { ShoppingIntent } from "./types";

const product: Product = {
  id: "p-1",
  title: "Wireless noise cancelling headphones",
  source: "channel3",
  price: { amount: 80, currency: "USD" },
  merchant: "Example Merchant",
  category: "Headphones",
  description: "Comfortable headphones for commuting.",
  imageUrl: "https://example.com/image.jpg",
  features: ["noise cancellation", "Bluetooth"],
  specifications: { "battery-type": "Rechargeable" },
};

const intent: ShoppingIntent = {
  category: "Headphones",
  budget: { amount: 100, currency: "USD", isMaximum: true },
  requiredFeatures: ["noise cancellation", "waterproof"],
  preferences: ["Bluetooth"],
  missingRequirements: [],
};

describe("deterministic product evaluation", () => {
  it("reports matches, unmet requirements, currency-aware budget fit, and trade-offs", () => {
    const evaluation = evaluateProduct(product, intent);
    expect(evaluation.requiredFeatureMatches).toContain("noise cancellation");
    expect(evaluation.unmetRequirements).toContain("waterproof");
    expect(evaluation.budgetFit).toBe("within");
    expect(evaluation.preferenceMatches).toContain("Bluetooth");
    expect(evaluation.tradeoffs).toContain("Required feature not found: waterproof.");
    expect(evaluation.score).toBeGreaterThan(0);
  });

  it("ranks products without producing suitability percentages", () => {
    const result = evaluateProducts([product], intent);
    expect(result).toHaveLength(1);
    expect(Object.values(EVALUATION_WEIGHTS).reduce((sum, weight) => sum + weight, 0)).toBe(100);
    expect(result[0]).toHaveProperty("score");
    expect(result[0]).not.toHaveProperty("suitabilityPercentage");
  });
});
