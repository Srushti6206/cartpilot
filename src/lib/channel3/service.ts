import { Channel3Error, Channel3TimeoutError } from "@channel3/sdk";
import { getChannel3Client } from "@/lib/channel3/client";
import { mapChannel3Product } from "@/lib/channel3/adapter";

export class Channel3ServiceError extends Error {
  constructor(
    readonly code: "missing-key" | "validation" | "timeout" | "rate-limit" | "upstream",
    message: string,
    readonly status = 502,
  ) {
    super(message);
  }
}

function normalizeError(error: unknown): Channel3ServiceError {
  if (error instanceof Channel3TimeoutError) {
    return new Channel3ServiceError("timeout", "Channel3 took too long to respond.", 504);
  }
  if (error instanceof Channel3Error) {
    if (error.statusCode === 429) {
      return new Channel3ServiceError("rate-limit", "Channel3 rate limit reached. Try again shortly.", 429);
    }
    return new Channel3ServiceError("upstream", "Channel3 could not complete the request.", error.statusCode ?? 502);
  }
  if (error instanceof Error && error.message === "CHANNEL3_API_KEY is not configured.") {
    return new Channel3ServiceError("missing-key", "Channel3 is not configured on this server.", 503);
  }
  return new Channel3ServiceError("upstream", "Could not connect to Channel3.", 502);
}

export interface SearchInput {
  query: string;
  maxPrice?: number;
  minPrice?: number;
  pageToken?: string;
}

export async function searchProducts(input: SearchInput) {
  const query = input.query.trim();
  if (!query) throw new Channel3ServiceError("validation", "Enter a product search.", 400);
  if (input.maxPrice != null && (!Number.isFinite(input.maxPrice) || input.maxPrice < 0)) {
    throw new Channel3ServiceError("validation", "Maximum price must be a non-negative number.", 400);
  }
  if (input.minPrice != null && (!Number.isFinite(input.minPrice) || input.minPrice < 0)) {
    throw new Channel3ServiceError("validation", "Minimum price must be a non-negative number.", 400);
  }
  if (input.minPrice != null && input.maxPrice != null && input.minPrice > input.maxPrice) {
    throw new Channel3ServiceError("validation", "Minimum price cannot exceed maximum price.", 400);
  }

  try {
    const client = getChannel3Client();
    const response = await client.products.search({
      query,
      limit: 20,
      ...(input.pageToken ? { page_token: input.pageToken } : {}),
      ...(input.minPrice != null || input.maxPrice != null
        ? { filters: { price: { min_price: input.minPrice, max_price: input.maxPrice } } }
        : {}),
    });
    return {
      products: response.data.map(mapChannel3Product),
      nextPageToken: response.response.next_page_token ?? null,
    };
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getProduct(productId: string) {
  if (!productId.trim()) throw new Channel3ServiceError("validation", "Product ID is required.", 400);
  try {
    const product = await getChannel3Client().products.retrieve({ product_id: productId });
    return mapChannel3Product(product);
  } catch (error) {
    throw normalizeError(error);
  }
}
