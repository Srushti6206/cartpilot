"use client";

import Link from "next/link";
import { ArrowRight, Check, GitCompareArrows, ShoppingBag } from "lucide-react";
import { useStore } from "@/components/store-provider";

export function ProductActions({ productId }: Readonly<{ productId: string }>) {
  const { addToCart, comparedProductIds, toggleCompare } = useStore();
  const compared = comparedProductIds.includes(productId);
  const compareFull = !compared && comparedProductIds.length >= 3;

  return (
    <div className="detail-actions">
      <button className="button-dark" onClick={() => addToCart(productId)} type="button">
        <ShoppingBag size={15} aria-hidden="true" /> Add to sample cart <ArrowRight size={15} aria-hidden="true" />
      </button>
      <button
        aria-label={compareFull ? "Comparison full; remove a product before adding this one" : undefined}
        aria-pressed={compared}
        className={compared ? "detail-compare is-selected" : "detail-compare"}
        disabled={compareFull}
        onClick={() => toggleCompare(productId)}
        title={compareFull ? "Remove a product from comparison first" : undefined}
        type="button"
      >
        {compared ? <Check size={15} aria-hidden="true" /> : <GitCompareArrows size={15} aria-hidden="true" />}
        {compared ? "Added to compare" : "Add to compare"}
      </button>
      <Link className="detail-cart-link" href="/cart">View cart</Link>
    </div>
  );
}
