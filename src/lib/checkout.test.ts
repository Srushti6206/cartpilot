import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/channel3/service", () => ({ getProduct: vi.fn() }));

import { getProduct } from "@/lib/channel3/service";
import {
  amountFromCents,
  createCheckoutBinding,
  getCheckoutBindingDiagnostics,
  hashCartSnapshot,
  validateCart,
  verifyAmountCurrency,
  verifyCheckoutBinding,
} from "@/lib/checkout";

describe("checkout validation and binding", () => {
  beforeEach(() => {
    process.env.PAYPAL_CLIENT_SECRET = "test-secret";
    vi.mocked(getProduct).mockResolvedValue({
      id: "prod_1",
      title: "Live product",
      source: "channel3",
      price: { amount: 19.99, currency: "USD" },
      merchant: "merchant",
      category: "test",
      imageUrl: "https://example.com/image.jpg",
      specifications: {},
    });
  });

  it("calculates trusted cents and rejects an empty cart", async () => {
    await expect(validateCart([])).rejects.toThrow("cart is empty");
    await expect(validateCart([{ productId: "prod_1", quantity: 0 }])).rejects.toThrow("invalid product or quantity");
    const cart = await validateCart([{ productId: "prod_1", quantity: 2, price: 1 }]);
    expect(cart.totalCents).toBe(3998);
    expect(cart.items[0].unitAmount).toBe(19.99);
  });

  it("binds the snapshot and rejects tampering", async () => {
    const cart = await validateCart([{ productId: "prod_1", quantity: 1 }]);
    const binding = createCheckoutBinding(cart);
    expect(binding.length).toBeLessThanOrEqual(127);
    expect(getCheckoutBindingDiagnostics(binding)).toEqual({
      customIdPresent: true,
      customIdLength: binding.length,
      expectedPrefix: "v1.",
      prefixMatches: true,
    });
    expect(verifyCheckoutBinding(binding).snapshotHash).toBe(hashCartSnapshot([{ productId: "prod_1", quantity: 1 }]));
    expect(() => verifyCheckoutBinding(`${binding.slice(0, -1)}x`)).toThrow("Invalid checkout binding");
  });

  it("reports a missing custom_id without exposing its value", () => {
    expect(getCheckoutBindingDiagnostics(undefined)).toEqual({
      customIdPresent: false,
      customIdLength: 0,
      expectedPrefix: "v1.",
      prefixMatches: false,
    });
  });

  it("rejects an expired binding", async () => {
    const cart = await validateCart([{ productId: "prod_1", quantity: 1 }]);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const binding = createCheckoutBinding(cart);
    vi.setSystemTime(new Date("2026-01-01T00:31:00Z"));
    expect(() => verifyCheckoutBinding(binding)).toThrow("expired or invalid");
    vi.useRealTimers();
  });

  it("verifies PayPal amount and currency", () => {
    verifyAmountCurrency({ value: amountFromCents(1999), currency_code: "USD" }, 1999, "USD");
    expect(() => verifyAmountCurrency({ value: "20.00", currency_code: "USD" }, 1999, "USD")).toThrow("did not match");
    expect(() => verifyAmountCurrency({ value: "19.99", currency_code: "EUR" }, 1999, "USD")).toThrow("did not match");
  });
});
