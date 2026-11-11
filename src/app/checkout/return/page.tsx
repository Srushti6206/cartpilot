"use client";

import Link from "next/link";
import { Check, ShieldCheck, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useStore } from "@/components/store-provider";
import { saveVerifiedOrder } from "@/lib/orders";
import type { VerifiedOrder } from "@/types/order";

type ReturnState = "loading" | "success" | "cancelled" | "error";
interface ReturnQuery {
  cancelled: boolean;
  orderId: string;
}

const emptyReturnQuery: ReturnQuery = { cancelled: false, orderId: "" };
let locationSnapshot = emptyReturnQuery;
let locationSearch = "";

function subscribeToLocation(listener: () => void) {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}

function getLocationSnapshot() {
  const search = window.location.search;
  if (search !== locationSearch) {
    const params = new URLSearchParams(search);
    locationSearch = search;
    locationSnapshot = {
      cancelled: params.get("cancelled") === "1",
      orderId: params.get("token") ?? "",
    };
  }
  return locationSnapshot;
}

function getServerLocationSnapshot() {
  return emptyReturnQuery;
}

export default function CheckoutReturnPage() {
  const { cart, clearCart } = useStore();
  const returnQuery = useSyncExternalStore(
    subscribeToLocation,
    getLocationSnapshot,
    getServerLocationSnapshot,
  );
  const [state, setState] = useState<ReturnState>("loading");
  const [message, setMessage] = useState("");
  const [order, setOrder] = useState<VerifiedOrder | null>(null);

  useEffect(() => {
    if (returnQuery.cancelled || !returnQuery.orderId) return;
    let active = true;
    void fetch("/api/checkout/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: returnQuery.orderId,
        items: cart.map(({ productId, quantity }) => ({ productId, quantity })),
      }),
    })
      .then(async (response) => {
        const payload = await response.json() as { paid?: boolean; order?: VerifiedOrder; error?: string };
        if (!response.ok || !payload.paid || !payload.order) throw new Error(payload.error ?? "PayPal capture could not be verified.");
        if (!active) return;
        saveVerifiedOrder(payload.order);
        setOrder(payload.order);
        clearCart();
        setState("success");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "PayPal capture could not be verified.");
        setState("error");
      });
    return () => { active = false; };
  }, [cart, clearCart, returnQuery]);

  return (
    <div className="page-width orders-page">
      <div className="route-heading">
        <div>
          <div className="section-eyebrow"><ShieldCheck size={13} aria-hidden="true" /> PAYPAL SANDBOX</div>
          <h1>Checkout <em>status.</em></h1>
          <p>CartPilot records an order only after PayPal capture is verified on the server.</p>
        </div>
      </div>
      {returnQuery.cancelled && <div className="orders-empty" role="status"><span className="orders-empty-icon"><X size={25} aria-hidden="true" /></span><h2>Checkout cancelled.</h2><p>Your cart is unchanged. No payment was captured.</p><Link className="button-dark" href="/cart">Return to cart</Link></div>}
      {!returnQuery.cancelled && !returnQuery.orderId && <div className="orders-empty" role="alert"><span className="orders-empty-icon"><X size={25} aria-hidden="true" /></span><h2>Payment not verified.</h2><p>PayPal did not return an order ID.</p><div className="order-status-note"><ShieldCheck size={15} aria-hidden="true" /> Your cart was preserved and no paid order was saved.</div><Link className="button-dark" href="/cart">Return to cart</Link></div>}
      {!returnQuery.cancelled && returnQuery.orderId && state === "loading" && <div className="orders-empty" role="status"><ShieldCheck size={25} aria-hidden="true" /><h2>Verifying your PayPal payment…</h2><p>Please keep this page open while the server confirms the capture.</p></div>}
      {state === "success" && order && <div className="orders-empty" role="status"><span className="orders-empty-icon"><Check size={25} aria-hidden="true" /></span><h2>Payment verified.</h2><p>Order {order.paypalOrderId} was captured in PayPal Sandbox for {order.currency} {order.total.toFixed(2)}.</p><div className="order-status-note"><ShieldCheck size={15} aria-hidden="true" /> Saved to this browser’s order history.</div><Link className="button-dark" href="/orders">View order history</Link></div>}
      {state === "error" && <div className="orders-empty" role="alert"><span className="orders-empty-icon"><X size={25} aria-hidden="true" /></span><h2>Payment not verified.</h2><p>{message}</p><div className="order-status-note"><ShieldCheck size={15} aria-hidden="true" /> Your cart was preserved and no paid order was saved.</div><Link className="button-dark" href="/cart">Return to cart</Link></div>}
    </div>
  );
}
