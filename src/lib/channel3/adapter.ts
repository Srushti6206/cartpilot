import type { Channel3Api } from "@channel3/sdk";
import type { Product, ProductOffer } from "@/types/product";

function firstImage(product: Channel3Api.Product) {
  const image = product.images?.find((item) => item.is_main_image) ?? product.images?.[0];
  return image ? image.cleaned_url ?? image.url : "";
}

function mapOffer(offer: Channel3Api.ProductOffer): ProductOffer {
  return {
    url: offer.url,
    merchant: offer.domain,
    price: {
      amount: offer.price.price,
      currency: offer.price.currency,
      ...(offer.price.compare_at_price == null
        ? {}
        : { compareAtAmount: offer.price.compare_at_price }),
    },
    availability: offer.availability,
    ...(offer.condition == null ? {} : { condition: offer.condition }),
  };
}

export function mapChannel3Product(product: Channel3Api.Product): Product {
  const offers = product.offers?.map(mapOffer) ?? [];
  const firstOffer = offers[0];
  return {
    id: product.id,
    title: product.title,
    source: "channel3",
    price: firstOffer?.price ?? { amount: 0, currency: "USD" },
    merchant: firstOffer?.merchant ?? "Merchant unavailable",
    brand: product.brands?.[0]?.name,
    category: product.category?.title ?? "Uncategorized",
    description: product.description ?? undefined,
    imageUrl: firstImage(product),
    rating: product.ratings?.value,
    reviewCount: product.ratings?.count,
    colors: product.colors?.map((color) => color.hex),
    features: [
      ...(product.key_features ?? []),
      ...(product.materials ?? []),
    ],
    specifications: Object.fromEntries(
      Object.entries(product.structured_attributes ?? {}).map(([key, values]) => [
        key,
        values.join(", "),
      ]),
    ),
    offers,
  };
}
