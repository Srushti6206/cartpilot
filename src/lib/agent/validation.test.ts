import { describe, expect, it } from "vitest";
import {
  AgentValidationError,
  extractExplicitBudget,
  formatIntentSummary,
  resolveIntentBudget,
  sanitizeAgentMessage,
  toggleBudgetPreset,
  validateIntent,
  validateShoppingAgentRequest,
  validateToolArguments,
} from "./validation";

describe("agent validation", () => {
  it("bounds shopping requests and conversation history", () => {
    expect(validateShoppingAgentRequest({ message: " headphones " })).toEqual({ message: "headphones" });
    expect(() => validateShoppingAgentRequest({ message: "" })).toThrow(AgentValidationError);
    expect(() => validateShoppingAgentRequest({ message: "headphones", history: new Array(13).fill({ role: "user", content: "x" }) })).toThrow();
  });

  it("rejects unsafe or malformed tool arguments", () => {
    expect(() => validateToolArguments("search_products", { query: "x", maxPrice: -1 })).toThrow();
    expect(() => validateToolArguments("get_product_details", { productIds: ["bad id"] })).toThrow();
    expect(() => validateToolArguments("unknown", {})).toThrow();
  });

  it("requires explicit uppercase currency in an intent budget", () => {
    expect(validateIntent({
      requiredFeatures: [],
      preferences: [],
      missingRequirements: [],
      budget: { amount: 100, currency: "USD", isMaximum: true },
    }).budget?.currency).toBe("USD");
    expect(() => validateIntent({
      requiredFeatures: [],
      preferences: [],
      missingRequirements: [],
      budget: { amount: 100, currency: "usd", isMaximum: true },
    })).toThrow();
  });

  it("uses an explicit request budget before the selected preset", () => {
    const intent = validateIntent({
      requiredFeatures: [],
      preferences: [],
      missingRequirements: [],
      budget: { amount: 200, currency: "USD", isMaximum: true },
    });
    expect(resolveIntentBudget(intent, "User request:\nFind headphones under $100.\nSelected preset budget: Under $200.").budget).toEqual({
      amount: 100,
      currency: "USD",
      isMaximum: true,
    });
  });

  it("uses the preset only when the user request has no budget", () => {
    const intent = validateIntent({ requiredFeatures: [], preferences: [], missingRequirements: [] });
    expect(resolveIntentBudget(intent, "User request:\nFind headphones.\nSelected preset budget: Under $100.").budget?.amount).toBe(100);
    expect(resolveIntentBudget(intent, "User request:\nFind headphones.\nSelected preset budget: Under $200.").budget?.amount).toBe(200);
  });

  it("leaves the budget unset when neither source provides one", () => {
    const intent = validateIntent({
      requiredFeatures: [],
      preferences: [],
      missingRequirements: [],
      budget: { amount: 200, currency: "USD", isMaximum: true },
    });
    expect(resolveIntentBudget(intent, "User request:\nFind headphones.\nSelected preset budget: No limit.").budget).toBeUndefined();
    expect(extractExplicitBudget("Find headphones with no price limit.")).toBeUndefined();
  });

  it("preserves explicit currencies and supports common budget wording", () => {
    expect(extractExplicitBudget("Find a laptop below 800 USD")?.currency).toBe("USD");
    expect(extractExplicitBudget("Find a watch with a maximum 5,000 INR")?.currency).toBe("INR");
    expect(extractExplicitBudget("Find headphones with a budget of $50")?.amount).toBe(50);
  });

  it("supports selecting, switching, and clearing budget presets", () => {
    expect(toggleBudgetPreset(undefined, "Under $200")).toBe("Under $200");
    expect(toggleBudgetPreset("Under $200", "Under $100")).toBe("Under $100");
    expect(toggleBudgetPreset("Under $100", "Under $100")).toBeUndefined();
  });

  it("formats a readable summary and never exposes raw intent JSON", () => {
    const summary = formatIntentSummary({
      category: "Laptop",
      budget: { amount: 800, currency: "USD", isMaximum: true },
      requiredFeatures: ["16GB RAM"],
      preferences: [],
      useCase: "Programming and college work",
      missingRequirements: [],
    });
    expect(summary).toBe("Laptop · Up to $800 · 16GB RAM · Programming and college work");
    expect(summary).not.toContain("{");
    expect(sanitizeAgentMessage('{"category":"Laptop"}')).not.toContain("{");
  });
});
