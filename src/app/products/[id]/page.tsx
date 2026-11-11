import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Star } from "lucide-react";
import { ProductActions } from "@/components/product-actions";
import { formatPrice } from "@/lib/sample-products";
import { getProduct as getLiveProduct } from "@/lib/channel3/service";

export const instant = false;

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product;
  try {
    product = await getLiveProduct(id);
  } catch (error) {
    return (
      <div className="page-width detail-page" role="alert">
        <Link className="back-link" href="/"><ArrowLeft size={14} aria-hidden="true" /> Back to Discover</Link>
        <div className="catalog-empty">
          <h1>Live product details are unavailable</h1>
          <p>{error instanceof Error ? error.message : "Channel3 could not load this product."}</p>
          <Link className="button-outline" href="/">Return to Discover</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-width detail-page">
      <Link className="back-link" href="/"><ArrowLeft size={14} aria-hidden="true" /> Back to Discover</Link>
      <div className="detail-layout">
        <div className="detail-image">
          <Image alt={product.title} fill priority sizes="(max-width: 760px) 100vw, 56vw" src={product.imageUrl} unoptimized />
          <span className="detail-sample-tag">LIVE CHANNEL3 LISTING</span>
        </div>
        <div className="detail-copy">
          <div className="detail-category-row"><span>{product.category}</span>{product.rating != null && <span className="detail-rating"><Star size={13} fill="currentColor" aria-hidden="true" /> {product.rating.toFixed(1)}{product.reviewCount != null && <small> ({product.reviewCount} reviews)</small>}</span>}</div>
          <h1>{product.title}</h1>
          <div className="detail-brand">{product.brand ?? "Brand unavailable"}</div>
          <div className="detail-price">{formatPrice(product.price.amount, product.price.currency)} <span>{product.price.currency}</span></div>
          <div className="detail-merchant">Shown with <strong>{product.merchant}</strong></div>
          {product.description && <p className="detail-description">{product.description}</p>}
          {product.colors?.length ? <div className="detail-colors"><strong>Available colors</strong><div>{product.colors.map((color) => <span key={color}>{color}</span>)}</div></div> : null}
          <ProductActions productId={product.id} />
          <div className="detail-trust-note"><Check size={14} aria-hidden="true" /> Live Channel3 data · PayPal Sandbox checkout is available from your cart</div>
          {product.recommendationReason && <div className="detail-why"><span className="why-icon"><Check size={13} aria-hidden="true" /></span><div><strong>Why it may be worth a look</strong><p>{product.recommendationReason}</p></div></div>}
        </div>
      </div>
      <section className="specs-section">
        <div><div className="section-eyebrow">THE USEFUL DETAILS</div><h2>Good to know.</h2></div>
        <div className="specs-table">
          {Object.entries(product.specifications).map(([key, value]) => <div className="spec-row" key={key}><span>{key}</span><strong>{value}</strong></div>)}
        </div>
      </section>
      <section className="detail-pros-cons">
        <div><h2>What stands out</h2><ul className="comparison-list pros-list">{product.pros?.map((pro) => <li key={pro}><Check size={14} aria-hidden="true" />{pro}</li>)}</ul></div>
        <div><h2>Worth knowing</h2><ul className="comparison-list cons-list">{product.cons?.map((con) => <li key={con}><span>−</span>{con}</li>)}</ul></div>
      </section>
      <div className="detail-data-note">Prices, availability, merchants, and buy links are refreshed from Channel3 when this page loads.</div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product;
  try {
    product = await getLiveProduct(id);
  } catch {
    return { title: "Product | CartPilot" };
  }
  return { title: product ? `${product.title} | CartPilot` : "Product not found | CartPilot" };
}
