import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/channel3/service", () => ({
  searchProducts: vi.fn(),
  getProduct: vi.fn(),
}));

import { getProduct, searchProducts } from "@/lib/channel3/service";
import { executeShoppingTool } from "./tools";

describe("shopping tools", () => {
  beforeEach(() => vi.clearAllMocks());

  it("executes search through the existing Channel3 service", async () => {
    vi.mocked(searchProducts).mockResolvedValue({ products: [], nextPageToken: null });
    const result = await executeShoppingTool("search_products", { query: "headphones", maxPrice: 100 });
    expect(searchProducts).toHaveBeenCalledWith({ query: "headphones", minPrice: undefined, maxPrice: 100 });
    expect(result.data.products).toEqual([]);
  });

  it("retrieves only validated product IDs through Channel3", async () => {
    vi.mocked(getProduct).mockResolvedValue({
      id: "p-1",
      title: "Product",
      source: "channel3",
      price: { amount: 1, currency: "USD" },
      merchant: "Merchant",
      category: "Other",
      imageUrl: "",
      specifications: {},
    });
    await executeShoppingTool("get_product_details", { productIds: ["p-1"] });
    expect(getProduct).toHaveBeenCalledWith("p-1");
  });
});
