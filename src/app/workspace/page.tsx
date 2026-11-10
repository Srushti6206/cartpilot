"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Info, Send, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { sampleProducts } from "@/lib/sample-products";

const preferences = ["Long-lasting", "Easy to use", "Thoughtful materials", "Compact"];
const budgets = ["Under $100", "Under $200", "Under $500"];

export default function WorkspacePage() {
  const [budget, setBudget] = useState("Under $200");
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([
    "Long-lasting",
    "Easy to use",
  ]);
  const [prompt, setPrompt] = useState("");
  const [activePrompt, setActivePrompt] = useState("Help me find a few thoughtful everyday essentials.");
  const [showBudgetOptions, setShowBudgetOptions] = useState(false);

  const results = useMemo(() => {
    const ceiling = Number(budget.match(/\d+/)?.[0] ?? 500);
    const normalized = activePrompt.toLowerCase();
    return sampleProducts.filter((product) => {
      const categoryMatch =
        normalized.includes("camera")
          ? product.category === "Tech"
          : normalized.includes("light") || normalized.includes("lamp")
            ? product.id === "arc-table-light"
            : normalized.includes("audio") || normalized.includes("headphone")
              ? product.category === "Audio"
              : true;
      return categoryMatch && product.price.amount <= ceiling;
    }).slice(0, 3);
  }, [activePrompt, budget]);

  function submitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (prompt.trim()) {
      setActivePrompt(prompt.trim());
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
          <p>Tell us what matters. Browse a grounded sample shortlist while the AI connection is still in development.</p>
        </div>
        <span className="integration-pill"><span /> AI preview · not connected</span>
      </div>

      <div className="workspace-grid">
        <section className="conversation-panel" aria-label="Shopping brief and conversation">
          <div className="panel-topline">
            <div className="assistant-identity">
              <span className="assistant-avatar"><Sparkles size={16} aria-hidden="true" /></span>
              <span><strong>Your shopping partner</strong><small>Preview mode · no AI requests sent</small></span>
            </div>
            <span className="preview-live"><i /> PREVIEW</span>
          </div>

          <div className="conversation-content">
            <div className="conversation-day">YOUR BRIEF</div>
            <div className="assistant-message">
              <span className="assistant-message-icon"><Sparkles size={13} aria-hidden="true" /></span>
              <div>
                <p>{activePrompt}</p>
                <small>We’ll use your brief to filter the sample catalog. No AI model is connected yet.</small>
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
                    onClick={() => setBudget(option)}
                    type="button"
                  >
                    {budget === option && <Check size={12} aria-hidden="true" />}{option}
                  </button>
                ))}
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
            <button aria-label="Update shopping brief" disabled={!prompt.trim()} type="submit">
              <Send size={16} aria-hidden="true" />
            </button>
          </form>
          <div className="conversation-disclaimer"><Info size={12} aria-hidden="true" /> Preview mode uses simple catalog filters, not an AI model.</div>
        </section>

        <section className="recommendations-panel" aria-label="Product shortlist">
          <div className="recommendations-heading">
            <div>
              <div className="section-eyebrow">A SHORTLIST FOR YOU</div>
              <h2>Worth a closer look<span>.</span></h2>
              <p>{results.length} sample finds · based on your budget and brief</p>
            </div>
            <button aria-expanded={showBudgetOptions} className="recommendation-filter" onClick={() => setShowBudgetOptions(!showBudgetOptions)} type="button">
              {budget} <ChevronDown size={14} aria-hidden="true" />
            </button>
          </div>
          {showBudgetOptions && (
            <div className="budget-dropdown">
              {budgets.map((option) => (
                <button key={option} onClick={() => { setBudget(option); setShowBudgetOptions(false); }} type="button">
                  {option}{budget === option && <Check size={13} aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
          <div className="recommendation-reason">
            <span><Sparkles size={14} aria-hidden="true" /></span>
            <p><strong>Why these?</strong> Matches are drawn from sample catalog descriptions and your budget. Preferences are shown here but don’t affect ranking until the recommendation engine is connected.</p>
          </div>
          <div className="recommendation-list">
            {results.length ? results.map((product, index) => (
              <article className="recommendation-item" key={product.id}>
                <ProductCard product={product} priority={index === 0} />
                <div className="why-recommended">
                  <span className="why-icon"><Sparkles size={12} aria-hidden="true" /></span>
                  <span><strong>A sample match</strong>{product.recommendationReason}</span>
                </div>
              </article>
            )) : (
              <div className="workspace-no-results">
                <p>No sample products match this brief and budget together.</p>
                <button onClick={() => setBudget("Under $500")} type="button">Expand sample budget</button>
              </div>
            )}
          </div>
          <Link className="workspace-compare-link" href="/compare">
            Compare your shortlist <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
