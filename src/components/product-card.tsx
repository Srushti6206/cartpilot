"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, GitCompareArrows, ShoppingBag, Star } from "lucide-react";
import { formatPrice } from "@/lib/sample-products";
import type { Product } from "@/types/product";
import { useStore } from "@/components/store-provider";

export function ProductCard({
  product,
  priority = false,
}: Readonly<{ product: Product; priority?: boolean }>) {
  const { addToCart, comparedProductIds, toggleCompare } = useStore();
  const isCompared = comparedProductIds.includes(product.id);

  return (
    <article className="product-card">
      <Link
        aria-label={`View details for ${product.title}`}
        className="product-image-link"
        href={`/products/${product.id}`}
      >
        <div className="product-image-wrap">
          <Image
            alt={product.title}
            className="product-image"
            fill
            priority={priority}
            sizes="(max-width: 600px) 48vw, (max-width: 1000px) 32vw, 25vw"
            src={product.imageUrl}
            unoptimized
          />
          <span className="sample-image-tag">{product.source === "channel3" ? "LIVE" : "SAMPLE"}</span>
          {product.badge && <span className="product-badge">{product.badge}</span>}
          <span className="product-quick-view">
            View details <ArrowUpRight size={14} aria-hidden="true" />
          </span>
        </div>
      </Link>
      <div className="product-card-info">
        <div className="product-meta-row">
          <span className="product-category">{product.category}</span>
          {product.rating != null && <span className="product-rating"><Star size={12} fill="currentColor" aria-hidden="true" /> {product.rating.toFixed(1)}</span>}
        </div>
        <Link className="product-title" href={`/products/${product.id}`}>
          {product.title}
        </Link>
        <div className="product-merchant">{product.merchant}</div>
        <div className="product-price-row">
          <span className="product-price">{formatPrice(product.price.amount, product.price.currency)}</span>
          <span className="price-sample">{product.price.currency}</span>
        </div>
        <div className="product-card-actions">
          <button className="add-cart-button" onClick={() => addToCart(product.id)} type="button">
            <ShoppingBag size={14} aria-hidden="true" />
            Add to cart
          </button>
          <button
            aria-label={
              isCompared
                ? `Remove ${product.title} from comparison`
                : comparedProductIds.length >= 3
                  ? `Comparison full; remove a product before adding ${product.title}`
                  : `Compare ${product.title}`
            }
            aria-pressed={isCompared}
            className={`compare-icon-button${isCompared ? " is-selected" : ""}`}
            disabled={!isCompared && comparedProductIds.length >= 3}
            onClick={() => toggleCompare(product.id)}
            title={isCompared ? "Remove from compare" : comparedProductIds.length >= 3 ? "Remove a product from comparison first" : "Add to compare"}
            type="button"
          >
            {isCompared ? <Check size={16} aria-hidden="true" /> : <GitCompareArrows size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </article>
  );
}
