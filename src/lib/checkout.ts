import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getProduct } from "@/lib/channel3/service";
import type { CartLine, Product } from "@/types/product";
import type { OrderItem } from "@/types/order";

const CHECKOUT_CURRENCY = "USD";
const BINDING_VERSION = "v1";
const BINDING_TTL_SECONDS = 30 * 60;

export interface ValidatedCart {
  items: OrderItem[];
  totalCents: number;
  currency: "USD";
  snapshotHash: string;
}

export interface CheckoutBinding {
  version: typeof BINDING_VERSION;
  snapshotHash: string;
  totalCents: number;
  currency: typeof CHECKOUT_CURRENCY;
  expiresAt: number;
  nonce: string;
}

export interface CheckoutBindingDiagnostics {
  customIdPresent: boolean;
  customIdLength: number;
  expectedPrefix: "v1.";
  prefixMatches: boolean;
}

export function getCheckoutBindingDiagnostics(customId: unknown): CheckoutBindingDiagnostics {
  return {
    customIdPresent: typeof customId === "string" && customId.length > 0,
    customIdLength: typeof customId === "string" ? customId.length : 0,
    expectedPrefix: `${BINDING_VERSION}.`,
    prefixMatches: typeof customId === "string" && customId.startsWith(`${BINDING_VERSION}.`),
  };
}

function getBindingSecret() {
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!secret) throw new Error("PAYPAL_CLIENT_SECRET is not configured.");
  return secret;
}

function cents(amount: number) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Product has an invalid price.");
  return Math.round(amount * 100);
}

function canonicalItems(items: Pick<CartLine, "productId" | "quantity">[]) {
  return JSON.stringify(items.map((item) => ({ productId: item.productId, quantity: item.quantity })));
}

export function hashCartSnapshot(items: Pick<CartLine, "productId" | "quantity">[]) {
  return createHash("sha256").update(canonicalItems(items)).digest("base64url");
}

export async function validateCart(lines: unknown): Promise<ValidatedCart> {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("Your cart is empty.");
  }
  const cart = lines.map((line): CartLine => {
    if (
      !line ||
      typeof line !== "object" ||
      typeof (line as CartLine).productId !== "string" ||
      (line as CartLine).productId.length === 0 ||
      (line as CartLine).productId.length > 200 ||
      (line as CartLine).productId.trim() !== (line as CartLine).productId ||
      !Number.isInteger((line as CartLine).quantity) ||
      (line as CartLine).quantity < 1 ||
      (line as CartLine).quantity > 99
    ) {
      throw new Error("Cart contains an invalid product or quantity.");
    }
    return { productId: (line as CartLine).productId, quantity: (line as CartLine).quantity };
  });
  const products = await Promise.all(cart.map((line) => getProduct(line.productId)));
  const items = products.map((product, index) => toOrderItem(product, cart[index].quantity));
  const currencies = new Set(products.map((product) => product.price.currency.toUpperCase()));
  if (currencies.size !== 1 || !currencies.has(CHECKOUT_CURRENCY)) {
    throw new Error("PayPal checkout currently supports USD products only.");
  }
  const totalCents = items.reduce((total, item) => total + cents(item.unitAmount) * item.quantity, 0);
  if (totalCents <= 0) throw new Error("The cart total must be greater than zero.");
  return {
    items,
    totalCents,
    currency: CHECKOUT_CURRENCY,
    snapshotHash: hashCartSnapshot(cart),
  };
}

function toOrderItem(product: Product, quantity: number): OrderItem {
  return {
    productId: product.id,
    title: product.title,
    quantity,
    unitAmount: product.price.amount,
  };
}

function sign(payload: string) {
  return createHmac("sha256", getBindingSecret()).update(payload).digest("base64url");
}

export function createCheckoutBinding(cart: ValidatedCart): string {
  const payload = [
    BINDING_VERSION,
    cart.snapshotHash,
    cart.totalCents,
    cart.currency,
    Math.floor(Date.now() / 1000) + BINDING_TTL_SECONDS,
    randomBytes(6).toString("base64url"),
  ].join(".");
  return `${payload}.${sign(payload)}`;
}

export function verifyCheckoutBinding(value: unknown): CheckoutBinding {
  if (typeof value !== "string") throw new Error("Invalid checkout binding.");
  const parts = value.split(".");
  if (parts.length !== 7 || parts[0] !== BINDING_VERSION) throw new Error("Invalid checkout binding.");
  const payload = parts.slice(0, 6).join(".");
  const expected = sign(payload);
  const provided = Buffer.from(parts[6], "base64url");
  const actual = Buffer.from(expected, "base64url");
  if (provided.length !== actual.length || !timingSafeEqual(provided, actual)) {
    throw new Error("Invalid checkout binding.");
  }
  const totalCents = Number(parts[2]);
  const expiresAt = Number(parts[4]);
  if (
    !/^[A-Za-z0-9_-]+$/.test(parts[1]) ||
    parts[3] !== CHECKOUT_CURRENCY ||
    !Number.isSafeInteger(totalCents) ||
    totalCents <= 0 ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt < Math.floor(Date.now() / 1000)
  ) {
    throw new Error("Checkout approval expired or invalid.");
  }
  return {
    version: BINDING_VERSION,
    snapshotHash: parts[1],
    totalCents,
    currency: CHECKOUT_CURRENCY,
    expiresAt,
    nonce: parts[5],
  };
}

export function amountFromCents(totalCents: number) {
  return (totalCents / 100).toFixed(2);
}

export function amountToCents(value: string) {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) throw new Error("PayPal returned an invalid amount.");
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0") || 0);
}

export function verifyAmountCurrency(
  amount: { value?: unknown; currency_code?: unknown } | undefined,
  expectedCents: number,
  expectedCurrency: string,
) {
  if (
    !amount ||
    amount.currency_code !== expectedCurrency ||
    typeof amount.value !== "string" ||
    amountToCents(amount.value) !== expectedCents
  ) {
    throw new Error("PayPal amount or currency did not match the validated cart.");
  }
}
