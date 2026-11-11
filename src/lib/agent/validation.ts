import type { ConversationMessage, ShoppingAgentRequest, ShoppingIntent } from "./types";

const MAX_MESSAGE_LENGTH = 2_000;
const MAX_HISTORY_ITEMS = 12;
const MAX_HISTORY_MESSAGE_LENGTH = 1_000;

export class AgentValidationError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function validateShoppingAgentRequest(value: unknown): ShoppingAgentRequest {
  if (!isRecord(value) || typeof value.message !== "string") {
    throw new AgentValidationError("A shopping request is required.");
  }
  const message = value.message.trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    throw new AgentValidationError("Shopping requests must be between 1 and 2,000 characters.");
  }
  const history = validateHistory(value.history);
  return { message, ...(history.length ? { history } : {}) };
}

function validateHistory(value: unknown): ConversationMessage[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > MAX_HISTORY_ITEMS) {
    throw new AgentValidationError("Conversation history is too long.");
  }
  return value.map((item) => {
    if (
      !isRecord(item) ||
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string" ||
      !item.content.trim() ||
      item.content.length > MAX_HISTORY_MESSAGE_LENGTH
    ) {
      throw new AgentValidationError("Conversation history contains an invalid message.");
    }
    return { role: item.role, content: item.content.trim() };
  });
}

export function validateToolArguments(name: string, value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new AgentValidationError(`${name} arguments must be an object.`);
  if (name === "search_products") {
    if (typeof value.query !== "string" || !value.query.trim() || value.query.length > 500) {
      throw new AgentValidationError("Search query must be between 1 and 500 characters.");
    }
    for (const key of ["minPrice", "maxPrice"]) {
      if (value[key] != null && (typeof value[key] !== "number" || !Number.isFinite(value[key]) || value[key] < 0)) {
        throw new AgentValidationError(`${key} must be a non-negative number.`);
      }
    }
    if (value.minPrice != null && value.maxPrice != null && value.minPrice > value.maxPrice) {
      throw new AgentValidationError("Minimum price cannot exceed maximum price.");
    }
    return value;
  }
  if (name === "get_product_details") {
    if (!Array.isArray(value.productIds) || value.productIds.length < 1 || value.productIds.length > 5) {
      throw new AgentValidationError("Provide between one and five product IDs.");
    }
    if (!value.productIds.every((id) => typeof id === "string" && /^[A-Za-z0-9._:-]{1,200}$/.test(id))) {
      throw new AgentValidationError("Product IDs are invalid.");
    }
    return value;
  }
  throw new AgentValidationError(`Unsupported tool: ${name}.`);
}

export function validateIntent(value: unknown): ShoppingIntent {
  if (!isRecord(value)) throw new AgentValidationError("Gemini returned an invalid shopping intent.");
  const list = (key: string) => {
    const item = value[key];
    if (item == null) return [];
    if (!Array.isArray(item) || !item.every((entry) => typeof entry === "string" && entry.length <= 200)) {
      throw new AgentValidationError(`Intent field ${key} is invalid.`);
    }
    return item.map((entry) => entry.trim()).filter(Boolean);
  };
  const budgetValue = value.budget;
  let budget: ShoppingIntent["budget"];
  if (budgetValue != null) {
    if (
      !isRecord(budgetValue) ||
      typeof budgetValue.amount !== "number" ||
      !Number.isFinite(budgetValue.amount) ||
      budgetValue.amount < 0 ||
      typeof budgetValue.currency !== "string" ||
      !/^[A-Z]{3}$/.test(budgetValue.currency) ||
      typeof budgetValue.isMaximum !== "boolean"
    ) {
      throw new AgentValidationError("Intent budget is invalid.");
    }
    budget = {
      amount: budgetValue.amount,
      currency: budgetValue.currency,
      isMaximum: budgetValue.isMaximum,
    };
  }

  const text = (key: string) => typeof value[key] === "string" ? value[key].trim().slice(0, 300) || undefined : undefined;
  return {
    ...(text("category") ? { category: text("category") } : {}),
    ...(budget ? { budget } : {}),
    requiredFeatures: list("requiredFeatures"),
    preferences: list("preferences"),
    ...(text("useCase") ? { useCase: text("useCase") } : {}),
    missingRequirements: list("missingRequirements"),
  };
}

function extractRequestText(message: string) {
  const match = message.match(/(?:^|\n)User request:\s*\n?([\s\S]*?)(?=\nSelected preset budget:|\nPriorities:|\nNo additional priorities\.|$)/i);
  return (match?.[1] ?? message).trim();
}

function parseCurrency(value: string | undefined) {
  if (!value) return undefined;
  const normalized = value.toUpperCase();
  if (normalized === "$" || normalized === "USD" || normalized === "DOLLAR" || normalized === "DOLLARS") return "USD";
  if (normalized === "₹" || normalized === "INR" || normalized === "RUPEE" || normalized === "RUPEES") return "INR";
  if (normalized === "€" || normalized === "EUR" || normalized === "EURO" || normalized === "EUROS") return "EUR";
  if (normalized === "£" || normalized === "GBP" || normalized === "POUND" || normalized === "POUNDS") return "GBP";
  return undefined;
}

function parseBudgetAmount(value: string) {
  const amount = Number(value.replace(/,/g, ""));
  return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
}

export function extractExplicitBudget(message: string): ShoppingIntent["budget"] {
  const request = extractRequestText(message);
  const match = request.match(
    /\b(?:under|below|up\s+to|maximum|max|budget(?:\s+of)?|spend(?:\s+up\s+to)?)\s*(?:(\$|₹|€|£|USD|INR|EUR|GBP|dollars?|rupees?|euros?|pounds?)\s*)?(\d[\d,]*(?:\.\d{1,2})?)\s*(?:(\$|₹|€|£|USD|INR|EUR|GBP|dollars?|rupees?|euros?|pounds?))?/i,
  );
  if (!match) return undefined;
  const amount = parseBudgetAmount(match[2]);
  const currency = parseCurrency(match[1]) ?? parseCurrency(match[3]);
  if (amount == null || !currency) return undefined;
  return { amount, currency, isMaximum: true };
}

function extractPresetBudget(message: string): ShoppingIntent["budget"] {
  const match = message.match(/(?:^|\n)Selected preset budget:\s*(Under\s+\$[\d,]+|No limit)\.?/i);
  if (!match || match[1].toLowerCase() === "no limit") return undefined;
  const amount = parseBudgetAmount(match[1].replace(/^Under\s+\$/i, ""));
  return amount == null ? undefined : { amount, currency: "USD", isMaximum: true };
}

export function resolveIntentBudget(intent: ShoppingIntent, message: string): ShoppingIntent {
  const budget = extractExplicitBudget(message) ?? extractPresetBudget(message);
  if (budget) return { ...intent, budget };
  const withoutBudget = { ...intent };
  delete withoutBudget.budget;
  return withoutBudget;
}

export function formatIntentSummary(intent: ShoppingIntent) {
  const parts = [intent.category];
  if (intent.budget) {
    const formattedAmount = intent.budget.currency === "USD"
      ? `$${intent.budget.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
      : intent.budget.currency === "INR"
        ? `₹${intent.budget.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
        : `${intent.budget.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${intent.budget.currency}`;
    parts.push(`${intent.budget.isMaximum ? "Up to" : "Around"} ${formattedAmount}`);
  }
  if (intent.requiredFeatures.length) parts.push(intent.requiredFeatures.slice(0, 3).join(", "));
  if (intent.useCase) parts.push(intent.useCase);
  if (!intent.category && !intent.budget && !intent.requiredFeatures.length && !intent.useCase) {
    return "Your live shopping brief";
  }
  return parts.filter(Boolean).join(" · ");
}

export function sanitizeAgentMessage(message: string) {
  const trimmed = message.trim();
  let isJson = false;
  try {
    isJson = isRecord(JSON.parse(trimmed));
  } catch {
    isJson = false;
  }
  return isJson || /(?:^|\s)(?:intent|arguments?)\s*:\s*[\[{]/i.test(trimmed)
    ? "These live products were ranked using your shopping brief."
    : trimmed;
}

export function toggleBudgetPreset(current: string | undefined, next: string) {
  return current === next ? undefined : next;
}
