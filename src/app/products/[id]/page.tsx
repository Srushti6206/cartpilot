import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Star } from "lucide-react";
import { ProductActions } from "@/components/product-actions";
import { formatPrice, getProduct, sampleProducts } from "@/lib/sample-products";

export function generateStaticParams() {
  return sampleProducts.map((product) => ({ id: product.id }));
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  return (
    <div className="page-width detail-page">
      <Link className="back-link" href="/"><ArrowLeft size={14} aria-hidden="true" /> Back to Discover</Link>
      <div className="detail-layout">
        <div className="detail-image">
          <Image alt={`Illustrative sample image for ${product.title}`} fill priority sizes="(max-width: 760px) 100vw, 56vw" src={product.imageUrl} unoptimized />
          <span className="detail-sample-tag">SAMPLE LISTING · NOT A REAL OFFER</span>
        </div>
        <div className="detail-copy">
          <div className="detail-category-row"><span>{product.category}</span><span className="detail-rating"><Star size={13} fill="currentColor" aria-hidden="true" /> {product.rating} <small>({product.reviewCount} sample reviews)</small></span></div>
          <h1>{product.title}</h1>
          <div className="detail-brand">{product.brand} · illustrative demo product</div>
          <div className="detail-price">{formatPrice(product.price.amount)} <span>sample price</span></div>
          <div className="detail-merchant">Shown with <strong>{product.merchant}</strong></div>
          <p className="detail-description">{product.description}</p>
          <div className="detail-colors"><strong>Sample finishes</strong><div>{product.colors.map((color) => <span key={color}>{color}</span>)}</div></div>
          <ProductActions productId={product.id} />
          <div className="detail-trust-note"><Check size={14} aria-hidden="true" /> Clearly labeled sample data · no purchase is available</div>
          <div className="detail-why"><span className="why-icon"><Check size={13} aria-hidden="true" /></span><div><strong>Why it may be worth a look</strong><p>{product.recommendationReason}</p></div></div>
        </div>
      </div>
      <section className="specs-section">
        <div><div className="section-eyebrow">THE USEFUL DETAILS</div><h2>Good to know.</h2></div>
        <div className="specs-table">
          {Object.entries(product.specifications).map(([key, value]) => <div className="spec-row" key={key}><span>{key}</span><strong>{value}</strong></div>)}
        </div>
      </section>
      <section className="detail-pros-cons">
        <div><h2>What stands out</h2><ul className="comparison-list pros-list">{product.pros.map((pro) => <li key={pro}><Check size={14} aria-hidden="true" />{pro}</li>)}</ul></div>
        <div><h2>Worth knowing</h2><ul className="comparison-list cons-list">{product.cons.map((con) => <li key={con}><span>−</span>{con}</li>)}</ul></div>
      </section>
      <div className="detail-data-note">Every listing, merchant, specification, review and price on this page is sample data for interface development only.</div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  return { title: product ? `${product.title} | CartPilot` : "Product not found | CartPilot" };
}
