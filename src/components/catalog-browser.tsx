"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { sampleProducts } from "@/lib/sample-products";

const categories = ["All finds", "Audio", "Home", "Tech", "Everyday"];

export function CatalogBrowser() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [category, setCategory] = useState("All finds");
  const [sort, setSort] = useState("curated");
  const [maxPrice, setMaxPrice] = useState("any");

  const products = useMemo(() => {
    const normalizedQuery = submittedQuery.trim().toLowerCase();
    const filtered = sampleProducts.filter((product) => {
      const matchesCategory =
        category === "All finds" || product.category === category;
      const matchesQuery =
        !normalizedQuery ||
        `${product.title} ${product.brand} ${product.category} ${product.description}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesPrice =
        maxPrice === "any" || product.price.amount <= Number(maxPrice);
      return matchesCategory && matchesQuery && matchesPrice;
    });
    if (sort === "price-low") {
      return filtered.toSorted((a, b) => a.price.amount - b.price.amount);
    }
    if (sort === "rating") {
      return filtered.toSorted((a, b) => b.rating - a.rating);
    }
    return filtered;
  }, [category, maxPrice, sort, submittedQuery]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedQuery(query);
  };

  return (
    <>
      <section className="discover-hero">
        <div className="discover-hero-copy">
          <div className="eyebrow-light"><Sparkles size={13} aria-hidden="true" /> A LITTLE MORE THOUGHTFUL</div>
          <h1>Good finds.<br /><span>Better reasons.</span></h1>
          <p>Start with what you need. We’ll make it easier to find something that fits.</p>
          <form className="discover-search" onSubmit={handleSearch}>
            <Search size={19} strokeWidth={1.8} aria-hidden="true" />
            <input
              aria-label="Search the sample catalog"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try “something for slow Sunday mornings”"
              value={query}
            />
            <button type="submit">Find my thing <ArrowRight size={15} aria-hidden="true" /></button>
          </form>
          <div className="search-hints">
            <span>Popular:</span>
            {["desk lighting", "travel camera", "under $100"].map((hint) => (
              <button
                key={hint}
                onClick={() => {
                  setQuery(hint === "under $100" ? "" : hint);
                  setSubmittedQuery(hint === "under $100" ? "" : hint);
                  if (hint === "under $100") setMaxPrice("100");
                }}
                type="button"
              >
                {hint}
              </button>
            ))}
            <Link href="/workspace">Ask the AI workspace <ArrowUpRight size={12} aria-hidden="true" /></Link>
          </div>
        </div>
        <div className="hero-product-art">
          <div className="hero-art-halo" />
          <Image
            alt="Illustrative sample product photo of studio headphones"
            className="hero-art-image"
            fill
            priority
            sizes="(max-width: 760px) 90vw, 45vw"
            src={sampleProducts[0].imageUrl}
            unoptimized
          />
          <div className="hero-art-caption"><span>THE EVERYDAY EDIT</span><span>01 / 04</span></div>
          <div className="hero-art-note"><small>THE SLOW LIST</small><span>A few things<br />worth keeping.</span><i>01 — 04</i></div>
          <div className="hero-art-orbit"><span /><span /><span /></div>
        </div>
        <span className="hero-bottom-note">Illustrative sample catalog · products &amp; prices are not live listings</span>
      </section>

      <section className="catalog-section" aria-labelledby="trending-title">
        <div className="category-rail">
          <div className="category-rail-label">SHOP BY MOOD</div>
          <div className="category-chips" aria-label="Product categories">
            {categories.map((item) => (
              <button
                aria-pressed={category === item}
                className={`category-chip${category === item ? " is-active" : ""}`}
                key={item}
                onClick={() => setCategory(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          <Link className="browse-ai-link" href="/workspace">
            <Sparkles size={14} aria-hidden="true" /> Shopping with a brief <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </div>

        <div className="catalog-heading">
          <div>
            <div className="section-eyebrow">A GOOD PLACE TO START</div>
            <h2 id="trending-title">{submittedQuery ? `Finds for “${submittedQuery}”` : "Considered, not crowded."}</h2>
            <p>{submittedQuery ? "Matching items from our clearly marked sample catalog." : "A few popular picks to help you find your footing."}</p>
          </div>
          <div className="catalog-tools">
            <label className="select-control">
              <SlidersHorizontal size={14} aria-hidden="true" />
              <span className="sr-only">Filter by maximum sample price</span>
              <select aria-label="Filter by maximum sample price" onChange={(event) => setMaxPrice(event.target.value)} value={maxPrice}>
                <option value="any">Any sample price</option>
                <option value="100">Under $100</option>
                <option value="200">Under $200</option>
                <option value="500">Under $500</option>
              </select>
              <ChevronDown size={13} aria-hidden="true" />
            </label>
            <label className="select-control sort-control">
              <span className="sr-only">Sort products</span>
              <select aria-label="Sort products" onChange={(event) => setSort(event.target.value)} value={sort}>
                <option value="curated">Sort: curated</option>
                <option value="price-low">Price: low to high</option>
                <option value="rating">Top rated</option>
              </select>
              <ChevronDown size={13} aria-hidden="true" />
            </label>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index === 0} />
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <Search size={22} aria-hidden="true" />
            <h3>No sample finds for that search</h3>
            <p>Try a broader phrase or clear your filters. This catalog is only a small development sample.</p>
            <button
              className="button-outline"
              onClick={() => {
                setQuery("");
                setSubmittedQuery("");
                setCategory("All finds");
                setMaxPrice("any");
              }}
              type="button"
            >
              Clear search and filters
            </button>
          </div>
        )}
      </section>

      <section className="catalog-closer">
        <div className="closer-icon"><Sparkles size={18} aria-hidden="true" /></div>
        <div>
          <strong>Shopping for something specific?</strong>
          <span>Bring your budget and must-haves. The workspace helps organize the search.</span>
        </div>
        <Link className="button-dark button-small" href="/workspace">Open AI workspace <ArrowRight size={15} aria-hidden="true" /></Link>
      </section>
    </>
  );
}
