"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/sample-products";
import type { Product } from "@/types/product";

export default function CartPage() {
  const { cart, removeFromCart, setQuantity } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoadStatus, setProductLoadStatus] = useState<"loading" | "ready" | "error">("ready");
  const [productLoadError, setProductLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "loading" | "error">("idle");
  const [checkoutError, setCheckoutError] = useState("");
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setProducts([]);
      setProductLoadError("");
      if (!cart.length) {
        setProductLoadStatus("ready");
        return;
      }
      setProductLoadStatus("loading");
      try {
        const items = await Promise.all(cart.map(async (line) => {
          const response = await fetch(`/api/products/${encodeURIComponent(line.productId)}`);
          const payload = await response.json() as Product & { error?: string };
          if (!response.ok) throw new Error(payload.error ?? `Could not load ${line.productId}.`);
          return payload;
        }));
        if (!active) return;
        setProducts(items);
        setProductLoadStatus("ready");
      } catch (error: unknown) {
        if (!active) return;
        setProductLoadError(error instanceof Error ? error.message : "Could not load all cart products.");
        setProductLoadStatus("error");
      }
    });
    return () => { active = false; };
  }, [cart, retryCount]);
  const lines = cart
    .map((line) => ({ ...line, product: products.find((product) => product.id === line.productId) }))
    .filter((line): line is typeof line & { product: Product } => line.product !== undefined);
  const subtotal = lines.reduce(
    (total, line) => total + line.product.price.amount * line.quantity,
    0,
  );
  const cartCurrency = lines.length > 0 && lines.every((line) => line.product.price.currency === lines[0].product.price.currency)
    ? lines[0].product.price.currency
    : undefined;
  const cartReady = productLoadStatus === "ready" && lines.length === cart.length;
  const checkoutReady = cartReady && cartCurrency === "USD";
  const cartRefreshing = cart.length > 0 && (productLoadStatus === "loading" || lines.length !== cart.length);

  async function startCheckout() {
    if (productLoadStatus !== "ready" || lines.length !== cart.length || checkoutStatus === "loading") return;
    setCheckoutStatus("loading");
    setCheckoutError("");
    try {
      const response = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart.map(({ productId, quantity }) => ({ productId, quantity })) }),
      });
      const payload = await response.json() as { orderId?: string; approvalUrl?: string; error?: string };
      if (!response.ok || !payload.orderId || !payload.approvalUrl) {
        throw new Error(payload.error ?? "Could not start PayPal checkout.");
      }
      window.location.assign(payload.approvalUrl);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Could not start PayPal checkout.");
      setCheckoutStatus("error");
    }
  }

  return (
    <div className="page-width cart-page">
      <div className="route-heading">
        <div>
          <div className="section-eyebrow"><ShoppingBag size={13} aria-hidden="true" /> YOUR SHORTLIST, TOGETHER</div>
          <h1>Your <em>cart.</em></h1>
          <p>Review your live selections. Prices and merchant offers are refreshed before display.</p>
        </div>
      </div>
      {cartRefreshing && (
        <div className="cart-empty" role="status">
          <span className="orders-empty-icon"><ShoppingBag size={25} aria-hidden="true" /></span>
          <h2>Refreshing your cart.</h2>
          <p>Current Channel3 prices and product details are loading.</p>
        </div>
      )}
      {productLoadStatus === "error" && (
        <div className="cart-empty" role="alert">
          <span className="orders-empty-icon"><ShoppingBag size={25} aria-hidden="true" /></span>
          <h2>Cart details could not be refreshed.</h2>
          <p>{productLoadError} Your cart contents are preserved.</p>
          <button className="button-dark" onClick={() => setRetryCount((count) => count + 1)} type="button">Retry</button>
        </div>
      )}
      {cartReady && lines.length ? (
        <div className="cart-layout">
          <section className="cart-lines" aria-label="Cart items">
            {lines.map(({ product, quantity }) => (
              <article className="cart-line" key={product.id}>
                <Link className="cart-line-image" href={`/products/${product.id}`}>
                  <Image alt={product.title} fill sizes="140px" src={product.imageUrl} unoptimized />
                  <span>LIVE</span>
                </Link>
                <div className="cart-line-details">
                  <span className="product-category">{product.category} · {product.price.currency}</span>
                  <Link href={`/products/${product.id}`} className="cart-line-title">{product.title}</Link>
                  <span className="cart-line-merchant">{product.merchant}</span>
                  <div className="cart-line-controls">
                    <div className="quantity-control">
                      <button aria-label={`Decrease ${product.title} quantity`} onClick={() => setQuantity(product.id, quantity - 1)} type="button"><Minus size={13} aria-hidden="true" /></button>
                      <span>{quantity}</span>
                      <button aria-label={`Increase ${product.title} quantity`} onClick={() => setQuantity(product.id, quantity + 1)} type="button"><Plus size={13} aria-hidden="true" /></button>
                    </div>
                    <button className="remove-cart-line" onClick={() => removeFromCart(product.id)} type="button"><Trash2 size={13} aria-hidden="true" /> Remove</button>
                  </div>
                </div>
                <strong className="cart-line-price">{formatPrice(product.price.amount * quantity, product.price.currency)}</strong>
              </article>
            ))}
          </section>
          <aside className="cart-summary">
            <div className="section-eyebrow">CURRENT ORDER SUMMARY</div>
            <div className="summary-row"><span>Subtotal · refreshed prices</span><strong>{cartCurrency ? formatPrice(subtotal, cartCurrency) : "Mixed currencies"}</strong></div>
            <div className="summary-row"><span>Shipping</span><span>Not calculated</span></div>
            <div className="summary-divider" />
            <div className="summary-total"><span>Total</span><strong>{cartCurrency ? formatPrice(subtotal, cartCurrency) : "Mixed currencies"}</strong></div>
            <button className="button-dark" disabled={checkoutStatus === "loading" || !checkoutReady} onClick={() => void startCheckout()} type="button">
              {checkoutStatus === "loading" ? "Opening PayPal…" : "Pay with PayPal Sandbox"}
            </button>
            {checkoutError
              ? <p className="checkout-note" role="alert"><ShieldCheck size={14} aria-hidden="true" /> {checkoutError}</p>
              : <p className="checkout-note"><ShieldCheck size={14} aria-hidden="true" /> {cartCurrency !== "USD" ? "PayPal Sandbox checkout supports USD products only." : "PayPal Sandbox approval is required. No payment is recorded until capture is verified."}</p>}
            <Link className="continue-shopping" href="/">Continue exploring <ArrowRight size={14} aria-hidden="true" /></Link>
          </aside>
        </div>
      ) : (
        <div className="cart-empty">
          <span className="orders-empty-icon"><ShoppingBag size={25} aria-hidden="true" /></span>
          <h2>Your cart is ready for a good find.</h2>
          <p>Add something from Discover and current Channel3 details will be fetched before display.</p>
          <Link className="button-dark" href="/">Explore live finds <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      )}
    </div>
  );
}
