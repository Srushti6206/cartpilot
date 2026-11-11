import type { VerifiedOrder } from "@/types/order";

export const ORDERS_STORAGE_KEY = "cartpilot-orders";
export const ORDERS_UPDATED_EVENT = "cartpilot-orders-updated";

export function readVerifiedOrders(): VerifiedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed)
      ? parsed.filter((order): order is VerifiedOrder =>
          typeof order?.id === "string" &&
          typeof order?.paypalOrderId === "string" &&
          order?.status === "paid" &&
          typeof order?.total === "number" &&
          order?.currency === "USD" &&
          Array.isArray(order?.items),
        )
      : [];
  } catch {
    return [];
  }
}

export function saveVerifiedOrder(order: VerifiedOrder) {
  const existing = readVerifiedOrders().find((item) => item.id === order.id);
  const savedOrder = existing && order.items.length === 0 ? existing : order;
  const orders = [savedOrder, ...readVerifiedOrders().filter((item) => item.id !== order.id)];
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event(ORDERS_UPDATED_EVENT));
}
