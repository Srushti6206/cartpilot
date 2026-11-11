import { describe, expect, it } from "vitest";
import { mapChannel3Product } from "@/lib/channel3/adapter";

describe("mapChannel3Product", () => {
  it("preserves IDs, images, ratings, offers, prices, and merchant URLs", () => {
    const product = mapChannel3Product({
      id: "prod_123",
      title: "Test headphones",
      description: "A live product",
      brands: [{ id: "brand_1", name: "Example" }],
      images: [{ url: "https://example.com/image.jpg", is_main_image: true }],
      category: { slug: "audio", title: "Audio", path: [], has_children: false },
      offers: [{
        url: "https://merchant.example/item",
        domain: "merchant.example",
        price: { price: 99.5, currency: "EUR", compare_at_price: 120 },
        availability: "InStock",
        condition: "new",
      }],
      ratings: { value: 4.5, count: 10, source_count: 1 },
      structured_attributes: { material: ["Aluminum"] },
    });

    expect(product.id).toBe("prod_123");
    expect(product.imageUrl).toBe("https://example.com/image.jpg");
    expect(product.price).toEqual({ amount: 99.5, currency: "EUR", compareAtAmount: 120 });
    expect(product.offers?.[0]).toMatchObject({
      merchant: "merchant.example",
      url: "https://merchant.example/item",
      availability: "InStock",
    });
  });

  it("does not invent optional product fields", () => {
    const product = mapChannel3Product({ id: "prod_456", title: "Unknown product" });
    expect(product.description).toBeUndefined();
    expect(product.rating).toBeUndefined();
    expect(product.offers).toEqual([]);
  });
});
