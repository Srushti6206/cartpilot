export type PaymentStatus = "paid" | "failed" | "cancelled";

export interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  unitAmount: number;
}

export interface VerifiedOrder {
  id: string;
  paypalOrderId: string;
  status: PaymentStatus;
  total: number;
  currency: "USD";
  items: OrderItem[];
  paidAt?: string;
  failureMessage?: string;
}
