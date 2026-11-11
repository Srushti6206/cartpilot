"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Info, Send, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import type { AgentRecommendation, ProductEvaluation, ShoppingAgentResponse } from "@/lib/agent/types";
import { formatIntentSummary, sanitizeAgentMessage, toggleBudgetPreset } from "@/lib/agent/validation";
import type { Product } from "@/types/product";

const preferences = ["Long-lasting", "Easy to use", "Thoughtful materials", "Compact"];
const budgets = ["Under $100", "Under $200", "Under $500"];
type WorkspaceStatus = "idle" | "loading" | "recommendations" | "clarification" | "empty" | "error";
type RankedRecommendation = AgentRecommendation & { product: Product; evaluation?: ProductEvaluation };

export default function WorkspacePage() {
  const [budget, setBudget] = useState<string | undefined>();
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([
    "Long-lasting",
    "Easy to use",
  ]);
  const [prompt, setPrompt] = useState("");
  const [activePrompt, setActivePrompt] = useState("");
  const [agentMessage, setAgentMessage] = useState("");
  const [intentSummary, setIntentSummary] = useState("");
  const [recommendations, setRecommendations] = useState<RankedRecommendation[]>([]);
  const [status, setStatus] = useState<WorkspaceStatus>("idle");
  const [error, setError] = useState("");
  const [showBudgetOptions, setShowBudgetOptions] = useState(false);
  const [lastRequestMessage, setLastRequestMessage] = useState("");

  function buildRequestMessage(query: string) {
    return [
      `User request:\n${query}`,
      `Selected preset budget: ${budget ?? "No limit"}.`,
      selectedPreferences.length
        ? `Priorities: ${selectedPreferences.join(", ")}.`
        : "No additional priorities.",
    ].join("\n");
  }

  async function loadResults(requestMessage: string) {
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/agent/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: requestMessage }),
      });
      const payload = await response.json() as ShoppingAgentResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not load shopping recommendations.");

      const productById = new Map(payload.products.map((product) => [product.id, product]));
      const evaluationById = new Map(payload.evaluations.map((evaluation) => [evaluation.productId, evaluation]));
      const rankedRecommendations = [...payload.recommendations]
        .sort((a, b) => a.rank - b.rank)
        .flatMap((recommendation) => {
          const product = productById.get(recommendation.productId);
          return product
            ? [{ ...recommendation, product, evaluation: evaluationById.get(recommendation.productId) }]
            : [];
        });

      setActivePrompt(requestMessage);
      setAgentMessage(sanitizeAgentMessage(payload.message));
      setIntentSummary(formatIntentSummary(payload.intent));
      setRecommendations(rankedRecommendations);
      setStatus(
        payload.status === "clarification"
          ? "clarification"
          : payload.status === "empty" || rankedRecommendations.length === 0
            ? "empty"
            : "recommendations",
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load live products.");
      setStatus("error");
    }
  }

  function submitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (prompt.trim() && status !== "loading") {
      const requestMessage = buildRequestMessage(prompt.trim());
      setLastRequestMessage(requestMessage);
      void loadResults(requestMessage);
      setPrompt("");
    }
  }

  function togglePreference(preference: string) {
    setSelectedPreferences((current) =>
      current.includes(preference)
        ? current.filter((item) => item !== preference)
        : [...current, preference],
    );
  }

  return (
    <div className="workspace-page page-width">
      <div className="route-heading workspace-heading">
        <div>
          <div className="section-eyebrow"><Sparkles size={13} aria-hidden="true" /> YOUR SHOPPING BRIEF</div>
          <h1>Let’s find your <em>kind of thing.</em></h1>
          <p>Tell us what matters. Browse a live Channel3 shortlist grounded in current merchant listings.</p>
        </div>
        <span className="integration-pill"><span /> AI + live catalog</span>
      </div>

      <div className="workspace-grid">
        <section className="conversation-panel" aria-label="Shopping brief and conversation">
          <div className="panel-topline">
            <div className="assistant-identity">
              <span className="assistant-avatar"><Sparkles size={16} aria-hidden="true" /></span>
              <span><strong>Your shopping partner</strong><small>Live catalog search · no payment requests sent</small></span>
            </div>
            <span className="preview-live"><i /> LIVE</span>
          </div>

          <div className="conversation-content">
            <div className="conversation-day">YOUR BRIEF</div>
            <div className="assistant-message">
              <span className="assistant-message-icon"><Sparkles size={13} aria-hidden="true" /></span>
              <div>
                <p>{activePrompt || "Tell me what you are looking for and I’ll search the live catalog."}</p>
                <small>Your request will be evaluated against current Channel3 listings.</small>
              </div>
            </div>
            <div className="conversation-day conversation-day-spaced">A FEW THINGS THAT HELP</div>
            <div className="brief-question">
              <div className="question-title">What’s your comfortable budget?</div>
              <div className="budget-options">
                {budgets.map((option) => (
                  <button
                    aria-pressed={budget === option}
                    className={budget === option ? "budget-option selected" : "budget-option"}
                    key={option}
                    onClick={() => setBudget((current) => toggleBudgetPreset(current, option))}
                    type="button"
                  >
                    {budget === option && <Check size={12} aria-hidden="true" />}{option}
                  </button>
                ))}
                <button
                  aria-pressed={budget == null}
                  className={budget == null ? "budget-option selected" : "budget-option"}
                  onClick={() => setBudget(undefined)}
                  type="button"
                >
                  {budget == null && <Check size={12} aria-hidden="true" />}No limit
                </button>
              </div>
            </div>

            <div className="brief-question preference-question">
              <div className="question-title">What matters most to you?</div>
              <div className="preference-options">
                {preferences.map((preference) => (
                  <button
                    aria-pressed={selectedPreferences.includes(preference)}
                    className={selectedPreferences.includes(preference) ? "preference-chip selected" : "preference-chip"}
                    key={preference}
                    onClick={() => togglePreference(preference)}
                    type="button"
                  >
                    {selectedPreferences.includes(preference) && <Check size={11} aria-hidden="true" />}
                    {preference}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form className="conversation-input" onSubmit={submitPrompt}>
            <label className="sr-only" htmlFor="shopping-brief">Add to your shopping brief</label>
            <input
              id="shopping-brief"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Add a detail, like “no plastic”"
              value={prompt}
            />
            <button aria-label="Update shopping brief" disabled={!prompt.trim() || status === "loading"} type="submit">
              <Send size={16} aria-hidden="true" />
            </button>
          </form>
          <div className="conversation-disclaimer"><Info size={12} aria-hidden="true" /> Live results come from Channel3; this workspace does not process payments.</div>
        </section>

        <section className="recommendations-panel" aria-label="Product shortlist">
          <div className="recommendations-heading">
            <div>
              <div className="section-eyebrow">A SHORTLIST FOR YOU</div>
              <h2>Worth a closer look<span>.</span></h2>
              <p>{recommendations.length} live finds · ranked for your budget and brief</p>
            </div>
            <button aria-expanded={showBudgetOptions} className="recommendation-filter" onClick={() => setShowBudgetOptions(!showBudgetOptions)} type="button">
              {budget ?? "No limit"} <ChevronDown size={14} aria-hidden="true" />
            </button>
          </div>
          {showBudgetOptions && (
            <div className="budget-dropdown">
              {budgets.map((option) => (
                <button key={option} onClick={() => { setBudget(option); setShowBudgetOptions(false); }} type="button">
                  {option}{budget === option && <Check size={13} aria-hidden="true" />}
                </button>
              ))}
              <button onClick={() => { setBudget(undefined); setShowBudgetOptions(false); }} type="button">
                No limit{budget == null && <Check size={13} aria-hidden="true" />}
              </button>
            </div>
          )}
          {status === "idle" && <div className="recommendation-reason" role="status"><p>Submit your brief to get ranked live recommendations.</p></div>}
          {status === "loading" && <div className="recommendation-reason" role="status"><p>Finding live products and evaluating the best matches…</p></div>}
          {status === "error" && (
            <div className="recommendation-reason" role="alert">
              <p>{error} <button onClick={() => void loadResults(lastRequestMessage)} type="button">Try again</button></p>
            </div>
          )}
          {status === "clarification" && (
            <div className="recommendation-reason" role="status">
              <span><Sparkles size={14} aria-hidden="true" /></span>
              <p><strong>One more detail</strong>{agentMessage}</p>
            </div>
          )}
          {status === "empty" && (
            <div className="workspace-no-results" role="status">
              <p>{agentMessage || "No live products match this brief and budget together."}</p>
              <button onClick={() => { setBudget("Under $500"); }} type="button">Expand budget</button>
            </div>
          )}
          {status === "recommendations" && (
            <>
              <div className="recommendation-reason">
                <span><Sparkles size={14} aria-hidden="true" /></span>
                <p><strong>{intentSummary}</strong></p>
                {agentMessage && <p>{agentMessage}</p>}
              </div>
              <div className="recommendation-list">
                {recommendations.map(({ product, evaluation, reasons, tradeoffs, evidence }, index) => (
                  <article className="recommendation-item" key={product.id}>
                    <ProductCard product={product} priority={index === 0} />
                    <div className="why-recommended">
                      <span className="why-icon"><Sparkles size={12} aria-hidden="true" /></span>
                      <div>
                        <strong>Ranked #{index + 1} · Score {evaluation?.score ?? "—"}/100</strong>
                        {reasons.length > 0 && <ul>{reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
                        {tradeoffs.length > 0 && <p><strong>Trade-offs:</strong> {tradeoffs.join(" ")}</p>}
                        {evidence.length > 0 && <p><strong>Evidence:</strong> {evidence.join(" ")}</p>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          <Link className="workspace-compare-link" href="/compare">
            Compare your shortlist <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
