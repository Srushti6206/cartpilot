# 🛒 CartPilot
### Stop searching. Start shopping with intent.

**Your AI-powered shopping companion - from natural-language discovery to intelligent recommendations and buyer-approved checkout.**

CartPilot reimagines online shopping with an AI shopping agent that understands what you want, discovers relevant products, evaluates your options, and helps you move from product discovery to checkout.

Instead of endlessly browsing, filtering, and comparing products, simply tell CartPilot what you need.

---

## ✨ Why CartPilot?

Online shopping gives us thousands of choices, but finding the *right* product is still time-consuming.

Traditional shopping experiences make users do most of the work:
- Search using multiple keywords.
- Apply filters and repeatedly refine results.
- Compare specifications, prices, and features manually.
- Decide which product best matches their requirements.

**CartPilot changes the interaction model.**

It transforms shopping from a search-and-filter process into an intent-driven experience.

You describe what you need. CartPilot helps you discover, evaluate, and choose.

## 🚀 What can CartPilot do?

| Feature | Description |
|---|---|
| 🧠 AI Shopping Workspace | Describe your shopping requirements in natural language. |
| 🔎 Live Product Discovery | Discover real product listings using Channel3. |
| 🎯 Intelligent Recommendations | Rank products against your budget, required features, and preferences. |
| 📊 Transparent Comparisons | Compare shortlisted products and understand their trade-offs. |
| 🛍️ Smart Cart | Manage selected products and quantities with refreshed product information. |
| 💳 PayPal Checkout | Complete buyer-approved transactions through PayPal Sandbox. |
| 📦 Order History | Review completed demo transactions. |
| 📱 Responsive Experience | Explore CartPilot through desktop and mobile interfaces. |

### How it works

1. **Describe:** Tell CartPilot what you're looking for, including your budget and preferences.
2. **Understand:** The AI agent interprets your shopping intent and determines which product information it needs.
3. **Discover:** Tool calling connects the agent to Channel3 for live product search and product details.
4. **Evaluate:** A deterministic evaluation engine scores relevant products against your requirements.
5. **Decide:** Explore ranked recommendations, explanations, and trade-offs.
6. **Checkout:** Add products to your cart and proceed to buyer-approved PayPal Sandbox checkout.

## 🧠 What makes CartPilot different?

### AI interpretation + deterministic evaluation

We don't rely on an LLM to invent product rankings.

CartPilot separates natural-language understanding from product evaluation.

The AI agent interprets the user's request and coordinates product discovery. Application logic then evaluates the retrieved products using a transparent scoring system.

**Recommendation scoring:**

| Evaluation criterion | Weight |
|---|---:|
| Required feature matches | 35 |
| Currency-aware budget fit | 25 |
| Preference matches | 15 |
| Product data completeness | 15 |
| Category match | 10 |
| **Total** | **100** |

Unknown product information is treated as unknown, not as a match.

This makes recommendations more explainable and keeps product facts grounded in retrieved catalog data.


## System Architecture

CartPilot follows a modular architecture that connects the frontend, AI orchestration, live product discovery, recommendation engine, and payment processing.

| Layer | Technology / Component | Responsibility |
|---|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS | User interface, shopping workspace, product discovery, cart and comparison |
| AI Orchestration | Next.js API Routes | Processes shopping requests and coordinates agent tools |
| LLM Inference | Groq API - GPT-OSS-20B | Understands natural-language intent and generates tool calls |
| Product Discovery | Channel3 SDK | Retrieves live product listings and product details |
| Recommendation Engine | Deterministic scoring engine | Evaluates products using features, budget, preferences, data completeness and category match |
| Payment Integration | PayPal REST API | Creates orders, handles buyer approval, captures and verifies payments |
| Payment Environment | PayPal Sandbox | Simulates secure checkout without real-money transactions |
| Client-side Storage | Browser Local Storage | Maintains cart, comparison selections and order history |

### Shopping Workflow

1. **User Input:** User describes their shopping requirements in natural language.
2. **AI Interpretation:** Groq-powered agent interprets the request and coordinates product discovery.
3. **Live Discovery:** Channel3 retrieves relevant products and product details.
4. **Intelligent Ranking:** CartPilot's deterministic scoring engine evaluates and ranks retrieved products.
5. **Shopping Actions:** Users inspect recommendations, compare products and manage their cart.
6. **Checkout:** PayPal Sandbox handles buyer approval and payment capture.
7. **Verification:** CartPilot verifies the captured payment before confirming the order.

> **Note:** Cart, comparison selections and order history are maintained in browser Local Storage. PayPal transactions use the Sandbox environment.

## 🛠️ Built With

### Frontend
- **Next.js** - App Router and server-side application architecture.
- **React** - Component-based user interface.
- **TypeScript** - Type-safe application development.
- **Tailwind CSS** - Responsive styling.

### AI & Product Discovery
- **Groq API** - AI inference and tool-calling orchestration.
- **OpenAI GPT-OSS-20B** (`openai/gpt-oss-20b`) - Natural-language shopping intent interpretation and agent reasoning.
- **Channel3 SDK** - Live product search and product-detail retrieval.
- **Deterministic evaluation engine** - Transparent product scoring and recommendation ranking.

### Payments
- **PayPal Developer Platform** - Sandbox payment integration.
- **PayPal REST API**
- **OAuth 2.0**
- **Orders API v2** - Order creation and payment capture.

## 🔌 Sponsor Integrations

### Channel3 - Live Product Discovery

Channel3 powers CartPilot's product discovery layer.

We use its SDK to retrieve live product listings and product details, allowing the AI shopping workflow to operate on actual catalog information rather than relying exclusively on static demo data.

### PayPal - Buyer-Approved Commerce

PayPal Sandbox powers the checkout experience.

CartPilot uses server-side OAuth authentication and the PayPal Orders API v2 to:
- Create checkout orders using server-validated cart information.
- Redirect buyers to PayPal for payment approval.
- Capture payments only after buyer approval.
- Verify capture status, amount, and currency.
- Preserve the cart when checkout is cancelled or unsuccessful.

**The buyer always remains in control of the payment.**

## 🔐 Engineering & Reliability

We designed CartPilot with reliability and clear system boundaries in mind.

- API credentials remain server-side.
- Product prices are refreshed from Channel3 before checkout.
- Client-submitted prices and totals are not trusted.
- Cart validation and payment verification happen server-side.
- Product-search and product-detail failures are surfaced explicitly.
- Checkout is blocked when cart information is incomplete or unsupported.
- Payment confirmation requires successful capture verification.
- No simulated successful payments or sample orders are presented as real transactions.

## 🧰 Tech Stack at a Glance

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| AI Inference | Groq |
| AI Model | GPT-OSS-20B |
| Product Discovery | Channel3 SDK |
| Payments | PayPal REST API v2 |
| Authentication | PayPal OAuth 2.0 |
| Persistence | Browser Local Storage |
| Testing | Vitest |
| Deployment | Vercel |

## ⚙️ Run Locally

### Prerequisites

- Node.js 20.9 or later
- npm
- Channel3 API key
- Groq API key
- PayPal Developer Sandbox credentials (for checkout testing)

### 1. Clone the repository

```bash
git clone https://github.com/Srushti6206/CartPilot.git
cd CartPilot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root.

```env
# Channel3
CHANNEL3_API_KEY=your_channel3_api_key

# AI Provider
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b

# Optional Gemini provider
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_gemini_model

# PayPal Sandbox
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
```

Groq is used when configured. Gemini remains an optional provider when Groq is not configured. Provider failures do not silently switch providers.

Never expose API credentials through `NEXT_PUBLIC_` variables or commit `.env.local`.

### 4. Start the development server

```bash
npm run dev
```

Open:

[http://localhost:3000](http://localhost:3000)

## 🧪 Run Checks

Run the following commands to validate the application:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## 📌 Current Implementation Scope

We believe in being transparent about what the current implementation supports.

- **Product marketplace:** Channel3 supplies live product listings and product details. Its documented markets include the US, Canada, UK, Australia, and supported European markets. India/INR is not listed; the current demo uses US/USD. CartPilot does not convert INR budgets into USD.
- **Demo artwork:** The Discover hero contains clearly labeled demo artwork. It is not represented as a live product listing.
- **Local persistence:** Cart and comparison selections store product IDs, selected options, and quantities in browser local storage. Product details are refreshed through Channel3.
- **Order history:** Completed demo order history is browser-local. It is not durable or tamper-resistant server-side persistence.
- **Payments:** PayPal integration uses Sandbox only. It does not process real payments.
- **Fulfillment:** PayPal Sandbox checkout demonstrates payment authorization and capture, not retailer order fulfillment, shipping, or delivery.

## 🔮 What's Next?

CartPilot is a starting point for a more capable personal commerce agent.

Our future direction includes:

- Multi-marketplace product discovery.
- More advanced conversational shopping workflows.
- Price tracking and deal intelligence.
- Deeper personalization with user consent.
- Persistent accounts and cross-device order history.
- Broader marketplace and payment-region support.

## 💡 Our Vision

We believe the future of commerce should be driven by user intent, not endless searching.

**Less searching. Better decisions. Smarter shopping.**





