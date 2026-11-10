# CartPilot

CartPilot is a shopping discovery experience for the PayPal AI Hackathon,
built as one Next.js App Router application with TypeScript and Tailwind CSS.

## Current UI scope

The app now has separate routes for Discover (`/`), AI Shopping Workspace
(`/workspace`), Product Comparison (`/compare`), Order History (`/orders`),
the Cart (`/cart`), and Product Details (`/products/[id]`).

The current catalog is illustrative sample data for interface development.
Products, photos, merchant names, reviews, specifications, recommendations,
and prices are not live listings. Discover search, category/price filters,
sorting, cart selection, and product comparison work locally in the browser.
Cart and compare selections are saved in local storage.

The AI workspace is a UI preview using simple local catalog filtering; no AI
provider or model is connected. PayPal checkout is deliberately unavailable;
there are no simulated successful payments or sample orders.

## Run locally

Requirements: Node.js 20.9 or later and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Planned integration boundaries

- **Product data:** Channel3 is planned as the primary source for real listings.
  DummyJSON/sample data must remain clearly identified as non-real development
  content.
- **AI:** Gemini API and local Ollama are planned behind a provider interface.
  The current workspace makes no AI calls.
- **Payments:** PayPal Sandbox is planned with server-side order creation,
  buyer approval, capture, and verification before order history reports a
  successful payment.
