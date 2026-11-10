"use client";

import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowRight, Check, GitCompareArrows, Plus, X } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { formatPrice, sampleProducts } from "@/lib/sample-products";

export default function ComparePage() {
  const { comparedProductIds, toggleCompare, clearCompare } = useStore();
  const selected = comparedProductIds
    .map((id) => sampleProducts.find((product) => product.id === id))
    .filter((product) => product !== undefined);
  const suggestions = sampleProducts.filter((product) => !comparedProductIds.includes(product.id)).slice(0, 4);

  return (
    <div className="page-width compare-page">
      <div className="route-heading compare-heading">
        <div>
          <div className="section-eyebrow"><GitCompareArrows size={13} aria-hidden="true" /> SIDE BY SIDE, CLEARER</div>
          <h1>Make a good <em>call.</em></h1>
          <p>Compare the details and trade-offs, not just the headline price.</p>
        </div>
        {selected.length > 0 && <button className="clear-compare" onClick={clearCompare} type="button"><X size={14} aria-hidden="true" /> Clear comparison</button>}
      </div>

      {selected.length > 0 ? (
        <div className="comparison-scroll">
          <div
            className={`comparison-table${selected.length === 1 ? " has-one" : ""}${selected.length === 2 ? " has-two" : ""}${selected.length === 3 ? " is-full" : ""}`}
            style={{ "--compare-columns": selected.length } as CSSProperties}
          >
            <div className="comparison-label-column">
              <div className="comparison-label-spacer" />
              {["Sample price", "Merchant", "Category", "Rating", "Details", "Pros", "Trade-offs", "Why it may fit"].map((label) => (
                <div className="comparison-row-label" key={label}>{label}</div>
              ))}
            </div>
            {selected.map((product) => (
              <article className="comparison-product-column" key={product.id}>
                <div className="comparison-product-head">
                  <button aria-label={`Remove ${product.title} from comparison`} className="remove-compare" onClick={() => toggleCompare(product.id)} type="button"><X size={14} aria-hidden="true" /></button>
                  <Link className="comparison-image" href={`/products/${product.id}`}>
                    <Image alt={`Illustrative sample image for ${product.title}`} fill sizes="240px" src={product.imageUrl} unoptimized />
                    <span>SAMPLE</span>
                  </Link>
                  <Link className="comparison-product-title" href={`/products/${product.id}`}>{product.title}</Link>
                </div>
                <div className="comparison-cell comparison-price">{formatPrice(product.price.amount)} <small>sample</small></div>
                <div className="comparison-cell">{product.merchant}</div>
                <div className="comparison-cell">{product.category}</div>
                <div className="comparison-cell"><span className="compare-rating">★ {product.rating}</span> <small>({product.reviewCount} sample reviews)</small></div>
                <div className="comparison-cell comparison-specs">{Object.entries(product.specifications).map(([key, value]) => <span key={key}><small>{key}</small>{value}</span>)}</div>
                <div className="comparison-cell"><ul className="comparison-list pros-list">{product.pros.map((pro) => <li key={pro}><Check size={13} aria-hidden="true" />{pro}</li>)}</ul></div>
                <div className="comparison-cell"><ul className="comparison-list cons-list">{product.cons.map((con) => <li key={con}><span>−</span>{con}</li>)}</ul></div>
                <div className="comparison-cell rationale-cell">{product.recommendationReason}</div>
              </article>
            ))}
            {selected.length < 3 && (
              <Link className="add-compare-column" href="/">
                <span><Plus size={19} aria-hidden="true" /></span>
                <strong>Add another find</strong>
                <small>Choose up to 3 products</small>
              </Link>
            )}
          </div>
          <div className="comparison-note">Sample catalog comparison. Specifications, prices, merchant names, and reviews are illustrative only.</div>
        </div>
      ) : (
        <div className="compare-empty">
          <span className="empty-icon"><GitCompareArrows size={24} aria-hidden="true" /></span>
          <h2>A little perspective goes a long way.</h2>
          <p>Choose products from Discover to compare their sample prices, specifications, pros, and trade-offs here.</p>
          <Link className="button-dark" href="/">Explore sample finds <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      )}

      <section className="compare-suggestions">
        <div className="catalog-heading">
          <div>
            <div className="section-eyebrow">A FEW PLACES TO START</div>
            <h2>{selected.length ? "Add another perspective." : "Popular in the sample edit."}</h2>
          </div>
        </div>
        <div className="suggestion-strip">
          {suggestions.map((product) => (
            <article className="suggestion-item" key={product.id}>
              <Link href={`/products/${product.id}`} className="suggestion-image">
                <Image alt={`Illustrative sample image for ${product.title}`} fill sizes="100px" src={product.imageUrl} unoptimized />
              </Link>
              <div><Link href={`/products/${product.id}`}>{product.title}</Link><span>{formatPrice(product.price.amount)} · sample</span></div>
              <button
                aria-label={`Add ${product.title} to comparison`}
                className="suggestion-add"
                disabled={selected.length >= 3}
                onClick={() => toggleCompare(product.id)}
                type="button"
              >
                <Plus size={15} aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
