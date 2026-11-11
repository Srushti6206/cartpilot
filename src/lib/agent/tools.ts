import { getProduct, searchProducts } from "@/lib/channel3/service";
import type { Product } from "@/types/product";
import { validateToolArguments } from "./validation";

export const shoppingToolDeclarations = [
  {
    type: "function",
    name: "search_products",
    description: "Search the live Channel3 catalog. Use explicit price bounds only when the user gave a budget.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        minPrice: { type: "number" },
        maxPrice: { type: "number" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_product_details",
    description: "Retrieve canonical details for Channel3 product IDs already found by search.",
    parameters: {
      type: "object",
      properties: {
        productIds: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
      },
      required: ["productIds"],
      additionalProperties: false,
    },
  },
] as const;

export interface ToolExecutionResult {
  name: string;
  data: { products: Product[]; nextPageToken?: string | null };
  source: "channel3" | "cache";
  durationMs: number;
}

export async function executeShoppingTool(
  name: string,
  rawArguments: unknown,
  cache: Map<string, ToolExecutionResult> = new Map(),
): Promise<ToolExecutionResult> {
  const args = validateToolArguments(name, rawArguments);
  const cacheKey = JSON.stringify([name, args]);
  const cached = cache.get(cacheKey);
  if (cached) return { ...cached, source: "cache" };
  const startedAt = performance.now();
  if (name === "search_products") {
    const result = {
      name,
      data: await searchProducts({
        query: args.query as string,
        minPrice: args.minPrice as number | undefined,
        maxPrice: args.maxPrice as number | undefined,
      }),
      source: "channel3" as const,
      durationMs: Math.round(performance.now() - startedAt),
    };
    cache.set(cacheKey, result);
    return result;
  }
  const products = await Promise.all((args.productIds as string[]).map((id) => getProduct(id)));
  const result = { name, data: { products }, source: "channel3" as const, durationMs: Math.round(performance.now() - startedAt) };
  cache.set(cacheKey, result);
  return result;
}
