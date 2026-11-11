"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, ShieldCheck } from "lucide-react";
import { useSyncExternalStore } from "react";
import { ORDERS_UPDATED_EVENT, readVerifiedOrders } from "@/lib/orders";
import type { VerifiedOrder } from "@/types/order";

function subscribeToOrders() {
  const handleUpdate = () => {
    ordersSnapshot = readVerifiedOrders();
  };
  window.addEventListener(ORDERS_UPDATED_EVENT, handleUpdate);
  window.addEventListener("storage", handleUpdate);
  return () => {
    window.removeEventListener(ORDERS_UPDATED_EVENT, handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}

let ordersSnapshot: VerifiedOrder[] | null = null;

function getOrdersSnapshot() {
  if (!ordersSnapshot) ordersSnapshot = readVerifiedOrders();
  return ordersSnapshot;
}

export default function OrdersPage() {
  const orders = useSyncExternalStore(subscribeToOrders, getOrdersSnapshot, () => [] as VerifiedOrder[]);

  return (
    <div className="page-width orders-page">
      <div className="route-heading">
        <div>
          <div className="section-eyebrow"><ClipboardList size={13} aria-hidden="true" /> YOUR SHOPPING, AT A GLANCE</div>
          <h1>Order <em>history.</em></h1>
          <p>A clear record of what you’ve chosen, with payment status you can trust.</p>
        </div>
      </div>

      {orders.length ? (
        <section className="cart-lines" aria-label="Verified orders">
          {orders.map((order) => (
            <article className="cart-line" key={order.id}>
              <span className="orders-empty-icon"><ShieldCheck size={25} aria-hidden="true" /></span>
              <div className="cart-line-details">
                <span className="product-category">PAID · PayPal Sandbox · {order.currency}</span>
                <strong className="cart-line-title">Order {order.paypalOrderId}</strong>
                <span className="cart-line-merchant">
                  {order.items.map((item) => (
                    <span key={item.productId}>
                      <Link href={`/products/${item.productId}`}>{item.title}</Link> × {item.quantity}
                    </span>
                  ))}
                </span>
                <span className="order-status-note">Verified capture · {order.paidAt ? new Date(order.paidAt).toLocaleString() : "date unavailable"}</span>
              </div>
              <strong className="cart-line-price">{order.currency} {order.total.toFixed(2)}</strong>
            </article>
          ))}
          <p className="checkout-note"><ShieldCheck size={14} aria-hidden="true" /> Order history is stored in this browser for the Sandbox demo.</p>
        </section>
      ) : <div className="orders-empty">
        <span className="orders-empty-icon"><ClipboardList size={25} aria-hidden="true" /></span>
        <span className="orders-empty-kicker">NOTHING HERE JUST YET</span>
        <h2>Your orders will show up here.</h2>
        <p>There are no verified orders in this demo. Order history will only show purchases after PayPal Sandbox capture is connected and confirmed.</p>
        <div className="order-status-note"><ShieldCheck size={15} aria-hidden="true" /> No sample or unverified payments are shown as completed.</div>
        <Link className="button-dark" href="/">Back to Discover <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>}
    </div>
  );
}
