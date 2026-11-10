export type ProductSource =
  | "channel3"
  | "dummyjson-sample"
  | "illustrative-sample";

export interface Product {
  id: string;
  title: string;
  source: ProductSource;
  price: {
    amount: number;
    currency: string;
  };
  merchant: string;
  brand?: string;
  category: string;
  description: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  colors: string[];
  specifications: Record<string, string>;
  pros: string[];
  cons: string[];
  recommendationReason: string;
  badge?: string;
}

export interface CartLine {
  productId: string;
  quantity: number;
}
