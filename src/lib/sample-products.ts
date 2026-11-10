import type { Product } from "@/types/product";

export const sampleProducts: Product[] = [
  {
    id: "studio-headphones",
    title: "Studio Wireless Headphones",
    source: "illustrative-sample",
    price: { amount: 189, currency: "USD" },
    merchant: "Northstar Audio · sample merchant",
    brand: "Northstar",
    category: "Audio",
    description:
      "A comfortable over-ear listening concept with soft-touch ear cups, balanced sound, and a long-wear fit.",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85",
    rating: 4.8,
    reviewCount: 214,
    colors: ["Ink", "Stone", "Moss"],
    specifications: {
      "Battery life": "Up to 38 hours",
      Connectivity: "Bluetooth 5.3",
      Weight: "248 g",
      Warranty: "2 years",
    },
    pros: ["Long battery life", "Comfortable for long sessions", "Folding design"],
    cons: ["No wired audio cable included", "No active noise cancellation"],
    recommendationReason:
      "A balanced pick for everyday listening, with a lightweight build and longer battery life than the other sample options.",
    badge: "Community favorite",
  },
  {
    id: "arc-table-light",
    title: "Arc Table Light",
    source: "illustrative-sample",
    price: { amount: 124, currency: "USD" },
    merchant: "Forma Living · sample merchant",
    brand: "Forma",
    category: "Home",
    description:
      "A sculptural, dimmable desk light concept with warm ambient settings and a compact footprint.",
    imageUrl:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85",
    rating: 4.7,
    reviewCount: 86,
    colors: ["Warm white", "Terracotta"],
    specifications: {
      Material: "Powder-coated aluminum",
      Brightness: "3 dimmable settings",
      Power: "USB-C",
      Height: "38 cm",
    },
    pros: ["Adjustable warm light", "Small desk footprint", "USB-C power"],
    cons: ["Adapter not included", "Indoor use only"],
    recommendationReason:
      "A useful fit for a small workspace, with adjustable warm light and a compact footprint.",
    badge: "Design pick",
  },
  {
    id: "everyday-camera",
    title: "Everyday Compact Camera",
    source: "illustrative-sample",
    price: { amount: 449, currency: "USD" },
    merchant: "Field Notes Camera Co. · sample merchant",
    brand: "Field Notes",
    category: "Tech",
    description:
      "A pocket-friendly camera concept for travel notes and everyday moments, with a bright lens and simple controls.",
    imageUrl:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85",
    rating: 4.6,
    reviewCount: 152,
    colors: ["Black", "Silver"],
    specifications: {
      Sensor: "24 MP APS-C",
      Lens: "23 mm equivalent",
      Video: "4K at 30 fps",
      Weight: "315 g",
    },
    pros: ["Compact body", "Bright fixed lens", "Simple tactile controls"],
    cons: ["Fixed lens", "Memory card sold separately"],
    recommendationReason:
      "The most travel-friendly camera in this sample set, trading lens flexibility for a smaller everyday carry.",
    badge: "For the curious",
  },
  {
    id: "weekend-tote",
    title: "Canvas Weekend Tote",
    source: "illustrative-sample",
    price: { amount: 78, currency: "USD" },
    merchant: "Common Thread · sample merchant",
    brand: "Common Thread",
    category: "Everyday",
    description:
      "A roomy, structured canvas tote concept with a zip top, reinforced handles, and an interior pocket.",
    imageUrl:
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=85",
    rating: 4.9,
    reviewCount: 173,
    colors: ["Natural", "Olive", "Navy"],
    specifications: {
      Material: "Recycled cotton canvas",
      Capacity: "18 L",
      Closure: "Top zip",
      "Care instructions": "Spot clean",
    },
    pros: ["Roomy interior", "Reinforced handles", "Recycled canvas"],
    cons: ["Not water resistant", "No padded laptop sleeve"],
    recommendationReason:
      "A versatile, lower-cost everyday option with a roomy interior and recycled canvas construction.",
    badge: "Thoughtful materials",
  },
  {
    id: "trail-bottle",
    title: "Trail Insulated Bottle",
    source: "illustrative-sample",
    price: { amount: 42, currency: "USD" },
    merchant: "Outside Hours · sample merchant",
    brand: "Outside Hours",
    category: "Everyday",
    description:
      "A double-wall insulated bottle concept with a powder-coated finish and a leak-resistant screw cap.",
    imageUrl:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1000&q=85",
    rating: 4.5,
    reviewCount: 98,
    colors: ["Cobalt", "Sand", "Pine"],
    specifications: {
      Capacity: "740 ml",
      Material: "Stainless steel",
      Insulation: "Double wall",
      "Dishwasher safe": "No",
    },
    pros: ["Keeps drinks cold", "Leak-resistant cap", "Fits most cup holders"],
    cons: ["Hand wash recommended", "Larger than a standard bottle"],
    recommendationReason:
      "A practical, budget-conscious option for commuting or day trips, with a larger capacity than most compact bottles.",
    badge: "Under $50",
  },
  {
    id: "soft-knit-throw",
    title: "Soft Knit Lounge Throw",
    source: "illustrative-sample",
    price: { amount: 96, currency: "USD" },
    merchant: "Slow Sunday Studio · sample merchant",
    brand: "Slow Sunday",
    category: "Home",
    description:
      "A soft, textured throw concept in a breathable cotton blend, sized for a sofa or reading chair.",
    imageUrl:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85",
    rating: 4.7,
    reviewCount: 67,
    colors: ["Oat", "Clay", "Sage"],
    specifications: {
      Material: "Cotton blend",
      Dimensions: "130 × 180 cm",
      "Care instructions": "Machine wash cold",
      Origin: "Sample listing",
    },
    pros: ["Breathable feel", "Machine washable", "Generous size"],
    cons: ["Not a heavyweight winter throw", "Color may vary by screen"],
    recommendationReason:
      "A comfortable all-season layer with straightforward care and a versatile size.",
  },
  {
    id: "daily-watch",
    title: "Daily Analog Watch",
    source: "illustrative-sample",
    price: { amount: 215, currency: "USD" },
    merchant: "Meridian Objects · sample merchant",
    brand: "Meridian",
    category: "Everyday",
    description:
      "A minimal analog watch concept with a brushed steel case, clear dial, and interchangeable strap.",
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85",
    rating: 4.4,
    reviewCount: 121,
    colors: ["Steel", "Ink"],
    specifications: {
      Movement: "Quartz",
      Case: "38 mm stainless steel",
      "Water resistance": "5 ATM",
      Strap: "Interchangeable",
    },
    pros: ["Clean, versatile design", "Interchangeable strap", "Slim profile"],
    cons: ["Quartz movement", "No included extra strap"],
    recommendationReason:
      "An understated daily option with a slim case and adaptable strap, designed for versatile wear.",
  },
];

export function getProduct(productId: string) {
  return sampleProducts.find((product) => product.id === productId);
}

export function formatPrice(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
