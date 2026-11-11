"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Check, GitCompareArrows, LoaderCircle, Plus, Search, X } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/sample-products";
import type { Product } from "@/types/product";

const specificationLabels: Record<string, string> = {
  "device-interface": "Device Interface",
  "battery-type": "Battery Type",
  "connectivity-technology": "Connectivity",
  "noise-cancellation-technology": "Noise Cancellation",
};

function humanizeSpecificationKey(key: string) {
  return specificationLabels[key] ?? key
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function MissingValue() {
  return <span className="comparison-unavailable">Not available</span>;
}

function renderList(items: string[] | undefined, icon: "pro" | "con") {
  if (!items?.length) return <MissingValue />;
  return (
    <ul className={`comparison-value-list ${icon === "pro" ? "is-pro" : "is-con"}`}>
      {items.map((item) => (
        <li key={item}>
          {icon === "pro" ? <Check size={14} aria-hidden="true" /> : <span aria-hidden="true">−</span>}
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function ComparePage() {
  const { comparedProductIds, toggleCompare, clearCompare } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorQuery, setSelectorQuery] = useState("");
  const [selectorResults, setSelectorResults] = useState<Product[]>([]);
  const [selectorStatus, setSelectorStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [selectorError, setSelectorError] = useState("");

  useEffect(() => {
    void Promise.all(comparedProductIds.map(async (id) => {
      const response = await fetch(`/api/products/${encodeURIComponent(id)}`);
      return response.ok ? await response.json() as Product : null;
    })).then((items) => setProducts(items.filter((item): item is Product => item !== null)));
  }, [comparedProductIds]);

  const selected = comparedProductIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => product !== undefined);
  const specificationKeys = [...new Set(
    selected.flatMap((product) => Object.keys(product.specifications)),
  )];
  const hasProsOrCons = selected.some(
    (product) => (product.pros?.length ?? 0) > 0 || (product.cons?.length ?? 0) > 0,
  );
  const isRefreshing = comparedProductIds.length > 0 && selected.length < comparedProductIds.length;
  const tableColumnCount = selected.length + (selected.length < 3 ? 2 : 1);
  const comparisonFull = comparedProductIds.length >= 3;

  const cells = (render: (product: Product) => ReactNode) =>
    selected.map((product) => <td key={product.id}>{render(product)}</td>);

  async function searchForComparisonProducts(query: string) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    setSelectorStatus("loading");
    setSelectorError("");
    try {
      const response = await fetch("/api/products/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmedQuery }),
      });
      const payload = await response.json() as { products?: Product[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not load live products.");
      setSelectorResults(payload.products ?? []);
      setSelectorStatus("ready");
    } catch (error) {
      setSelectorError(error instanceof Error ? error.message : "Could not load live products.");
      setSelectorStatus("error");
    }
  }

  function openSelector() {
    if (comparisonFull) return;
    setSelectorOpen(true);
    if (selectorStatus === "idle") {
      setSelectorQuery("everyday essentials");
      void searchForComparisonProducts("everyday essentials");
    }
  }

  function addProductToComparison(productId: string) {
    if (!comparedProductIds.includes(productId) && !comparisonFull) {
      toggleCompare(productId);
    }
  }

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
          <table className="comparison-table">
            <colgroup>
              <col className="comparison-label-column" />
              {selected.map((product) => <col key={product.id} className="comparison-product-column" />)}
              {selected.length < 3 && <col className="comparison-add-column" />}
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className="comparison-label-spacer">Specification</th>
                {selected.map((product) => (
                  <th scope="col" className="comparison-product-head" key={product.id}>
                    <button aria-label={`Remove ${product.title} from comparison`} className="remove-compare" onClick={() => toggleCompare(product.id)} type="button"><X size={14} aria-hidden="true" /></button>
                    <Link className="comparison-image" href={`/products/${product.id}`}>
                      <Image alt={product.title} fill sizes="240px" src={product.imageUrl} unoptimized />
                      <span>{product.source === "channel3" ? "LIVE" : "SAMPLE"}</span>
                    </Link>
                    <Link className="comparison-product-title" href={`/products/${product.id}`}>{product.title}</Link>
                  </th>
                ))}
                {selected.length < 3 && (
                  <th scope="col" className="add-compare-column">
                    <button className="add-compare-trigger" onClick={openSelector} type="button">
                      <span><Plus size={19} aria-hidden="true" /></span>
                      <strong>Add another find</strong>
                      <small>Choose up to 3 products</small>
                    </button>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="comparison-section-row"><th colSpan={tableColumnCount}>Price &amp; Merchant</th></tr>
              <tr>
                <th scope="row">Price</th>
                {cells((product) => <strong className="comparison-important">{formatPrice(product.price.amount, product.price.currency)} <small>{product.price.currency}</small></strong>)}
              </tr>
              <tr>
                <th scope="row">Merchant</th>
                {cells((product) => product.merchant || <MissingValue />)}
              </tr>

              <tr className="comparison-section-row"><th colSpan={tableColumnCount}>Ratings</th></tr>
              <tr>
                <th scope="row">Rating</th>
                {cells((product) => product.rating != null ? <span className="compare-rating">★ {product.rating.toFixed(1)}{product.reviewCount != null && <small> · {product.reviewCount} reviews</small>}</span> : <MissingValue />)}
              </tr>

              <tr className="comparison-section-row"><th colSpan={tableColumnCount}>Key Specifications</th></tr>
              {specificationKeys.map((key) => (
                <tr key={key}>
                  <th scope="row">{humanizeSpecificationKey(key)}</th>
                  {cells((product) => product.specifications[key] || <MissingValue />)}
                </tr>
              ))}
              {specificationKeys.length === 0 && (
                <tr><th scope="row">Specifications</th>{cells(() => <MissingValue />)}</tr>
              )}

              <tr className="comparison-section-row"><th colSpan={tableColumnCount}>Features</th></tr>
              <tr>
                <th scope="row">Features</th>
                {cells((product) => product.features?.length ? renderList(product.features, "pro") : <MissingValue />)}
              </tr>

              {hasProsOrCons && (
                <>
                  <tr className="comparison-section-row"><th colSpan={tableColumnCount}>Pros &amp; Cons</th></tr>
                  <tr>
                    <th scope="row">Pros</th>
                    {cells((product) => renderList(product.pros, "pro"))}
                  </tr>
                  <tr>
                    <th scope="row">Cons</th>
                    {cells((product) => renderList(product.cons, "con"))}
                  </tr>
                </>
              )}
            </tbody>
          </table>
          {isRefreshing && <p className="comparison-refreshing" role="status">Refreshing live product details…</p>}
          <div className="comparison-note">Prices, ratings, specifications, and merchant information are refreshed from Channel3.</div>
        </div>
      ) : (
        <div className="compare-empty" role={isRefreshing ? "status" : undefined}>
          <span className="empty-icon"><GitCompareArrows size={24} aria-hidden="true" /></span>
          <h2>{isRefreshing ? "Refreshing your comparison…" : "A little perspective goes a long way."}</h2>
          <p>{isRefreshing ? "Live product details are loading." : "Choose products from Discover to compare their live prices, specifications, and merchant details here."}</p>
          {!isRefreshing && <Link className="button-dark" href="/">Explore live finds <ArrowRight size={15} aria-hidden="true" /></Link>}
        </div>
      )}
      {selectorOpen && (
        <div className="comparison-selector-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectorOpen(false);
        }}>
          <section aria-labelledby="comparison-selector-title" aria-modal="true" className="comparison-selector" role="dialog">
            <div className="comparison-selector-header">
              <div>
                <div className="section-eyebrow"><Search size={13} aria-hidden="true" /> FIND ANOTHER PRODUCT</div>
                <h2 id="comparison-selector-title">Add another perspective.</h2>
                <p>{comparisonFull ? "Your comparison already has three products." : `${comparedProductIds.length} of 3 products selected.`}</p>
              </div>
              <button aria-label="Close product selector" className="comparison-selector-close" onClick={() => setSelectorOpen(false)} type="button"><X size={18} aria-hidden="true" /></button>
            </div>
            <form className="comparison-selector-search" onSubmit={(event) => { event.preventDefault(); void searchForComparisonProducts(selectorQuery); }}>
              <Search size={17} aria-hidden="true" />
              <input aria-label="Search products to compare" onChange={(event) => setSelectorQuery(event.target.value)} placeholder="Search live products" value={selectorQuery} />
              <button disabled={!selectorQuery.trim() || selectorStatus === "loading"} type="submit">Search</button>
            </form>
            {selectorStatus === "loading" && <div className="comparison-selector-state" role="status"><LoaderCircle className="comparison-selector-spinner" size={20} aria-hidden="true" /> Finding live products…</div>}
            {selectorStatus === "error" && <div className="comparison-selector-state" role="alert"><p>{selectorError}</p><button className="button-outline" onClick={() => void searchForComparisonProducts(selectorQuery)} type="button">Try again</button></div>}
            {selectorStatus === "ready" && selectorResults.length === 0 && <div className="comparison-selector-state"><p>No live products matched that search.</p></div>}
            {selectorStatus === "ready" && selectorResults.length > 0 && (
              <div className="comparison-selector-results">
                {selectorResults.map((product) => {
                  const alreadyCompared = comparedProductIds.includes(product.id);
                  return (
                    <article className="comparison-selector-result" key={product.id}>
                      <Link className="comparison-selector-image" href={`/products/${product.id}`} onClick={() => setSelectorOpen(false)}>
                        <Image alt={product.title} fill sizes="72px" src={product.imageUrl} unoptimized />
                      </Link>
                      <div className="comparison-selector-result-copy">
                        <Link href={`/products/${product.id}`} onClick={() => setSelectorOpen(false)}>{product.title}</Link>
                        <span>{formatPrice(product.price.amount, product.price.currency)} · {product.merchant}</span>
                      </div>
                      <button className="comparison-selector-add" disabled={alreadyCompared || comparisonFull} onClick={() => addProductToComparison(product.id)} type="button">
                        {alreadyCompared ? "Added" : comparisonFull ? "Full" : "Add to comparison"}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
            {comparisonFull && <p className="comparison-selector-limit">Comparison full. Remove a product before adding another.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
