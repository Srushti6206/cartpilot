"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { formatPrice, sampleProducts } from "@/lib/sample-products";
import type { Product } from "@/types/product";

export default function CartPage() {
  const { cart, removeFromCart, setQuantity } = useStore();
  const lines = cart
    .map((line) => ({
      ...line,
      product: sampleProducts.find((product) => product.id === line.productId),
    }))
    .filter(
      (line): line is typeof line & { product: Product } =>
        line.product !== undefined,
    );
  const subtotal = lines.reduce(
    (total, line) => total + line.product.price.amount * line.quantity,
    0,
  );

  return (
    <div className="page-width cart-page">
      <div className="route-heading">
        <div>
          <div className="section-eyebrow"><ShoppingBag size={13} aria-hidden="true" /> YOUR SHORTLIST, TOGETHER</div>
          <h1>Your <em>cart.</em></h1>
          <p>Review your sample selections. Checkout is not connected yet.</p>
        </div>
      </div>
      {lines.length ? (
        <div className="cart-layout">
          <section className="cart-lines" aria-label="Cart items">
            {lines.map(({ product, quantity }) => (
              <article className="cart-line" key={product.id}>
                <Link className="cart-line-image" href={`/products/${product.id}`}>
                  <Image alt={`Illustrative sample image for ${product.title}`} fill sizes="140px" src={product.imageUrl} unoptimized />
                  <span>SAMPLE</span>
                </Link>
                <div className="cart-line-details">
                  <span className="product-category">{product.category} · sample item</span>
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
                <strong className="cart-line-price">{formatPrice(product.price.amount * quantity)}</strong>
              </article>
            ))}
          </section>
          <aside className="cart-summary">
            <div className="section-eyebrow">SAMPLE ORDER SUMMARY</div>
            <div className="summary-row"><span>Subtotal · sample prices</span><strong>{formatPrice(subtotal)}</strong></div>
            <div className="summary-row"><span>Shipping</span><span>Not calculated</span></div>
            <div className="summary-divider" />
            <div className="summary-total"><span>Total</span><strong>{formatPrice(subtotal)} <small>sample only</small></strong></div>
            <button className="checkout-unavailable" disabled type="button">PayPal checkout · coming later</button>
            <p className="checkout-note"><ShieldCheck size={14} aria-hidden="true" /> Checkout is unavailable until verified PayPal Sandbox payments are implemented.</p>
            <Link className="continue-shopping" href="/">Continue exploring <ArrowRight size={14} aria-hidden="true" /></Link>
          </aside>
        </div>
      ) : (
        <div className="cart-empty">
          <span className="orders-empty-icon"><ShoppingBag size={25} aria-hidden="true" /></span>
          <h2>Your cart is ready for a good find.</h2>
          <p>Add something from the sample catalog and it’ll appear here. Prices are illustrative, and checkout is not connected.</p>
          <Link className="button-dark" href="/">Explore sample finds <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      )}
    </div>
  );
}
