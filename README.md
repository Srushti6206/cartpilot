# CartPilot

CartPilot is a shopping discovery experience for the PayPal AI Hackathon,
built as one Next.js App Router application with TypeScript and Tailwind CSS.

## Current UI scope

The app now has separate routes for Discover (`/`), AI Shopping Workspace
(`/workspace`), Product Comparison (`/compare`), Order History (`/orders`),
the Cart (`/cart`), and Product Details (`/products/[id]`).

Discover, product details, the AI Workspace, comparison, and cart display live
Channel3 product data. The Discover hero uses clearly labeled demo artwork;
it is not a product listing. Cart and compare selections are saved in local
storage.

The AI workspace sends shopping briefs to the server-side shopping agent, which
uses the configured provider and live Channel3 catalog to rank recommendations.
PayPal Sandbox checkout is available when the server credentials are configured;
there are no simulated successful payments or sample orders.

## Run locally

Requirements: Node.js 20.9 or later and npm.

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` and set `CHANNEL3_API_KEY` before using live search. The Phase 2A server-side shopping agent uses Groq when `GROQ_API_KEY` is configured; `GROQ_MODEL` defaults to `openai/gpt-oss-20b`. Gemini remains an optional provider when Groq is not configured, using `GEMINI_API_KEY` and `GEMINI_MODEL` (default `gemini-3.8-flash`). Provider failures do not silently switch providers. Do not use `NEXT_PUBLIC_` variables for any credential. Channel3's documented markets currently include the US, Canada, UK, Australia, and supported European markets; India and INR are not listed, so the default demo locale is explicit US/USD. CartPilot never interprets an INR budget as USD.

For PayPal Sandbox checkout, set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and
`PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com` in `.env.local`. PayPal
credentials and access tokens stay server-side. The server reloads current
Channel3 product data, validates the cart, calculates a USD total in integer
cents, creates a PayPal Orders API v2 `CAPTURE` order, and captures only after
buyer approval. It verifies capture status, amount, and currency before showing
an order as paid.

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

## Planned integration boundaries

- **Product data:** Channel3 is the live source for Discover, Workspace, and
  product details. Search and detail failures are shown explicitly; the app
  does not silently fall back to sample products. The sample catalog remains
  only for clearly labeled demo artwork and development fixtures; live
  recommendations, product details, prices, and merchant data come from Channel3.
- **Freshness:** local storage stores product IDs, selected options, and
  quantities only. Cart and comparison views refresh product details, offers,
  prices, and merchant URLs through Channel3 before displaying them.
- **AI:** Phase 2A adds a server-only Groq Chat Completions orchestrator with
  only `search_products` and `get_product_details` tools. Gemini remains an
  optional provider. Channel3 remains the
  source of truth for products, while application code deterministically scores
  budget fit, feature matches, data completeness, and trade-offs. If Gemini is
  unavailable, the endpoint labels its validated Channel3 shortlist as
  deterministic rather than presenting it as AI-generated.
  The transparent score is out of 100: required-feature matches 35,
  currency-aware budget fit 25, preference matches 15, data completeness 15,
  and category match 10. Unknown data is reported as unknown and never treated
  as a match.
- **Payments:** PayPal Sandbox uses server-side order creation, buyer approval,
  capture, and verification. Browser-local order history is only a demo
  convenience; it is not durable or tamper-resistant persistence. Checkout is
  USD-only, does not represent retailer fulfillment or delivery, and should be
  presented as a Sandbox demonstration.
