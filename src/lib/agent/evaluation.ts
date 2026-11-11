import type { Product } from "@/types/product";
import type { ProductEvaluation, ShoppingIntent } from "./types";

export const EVALUATION_WEIGHTS = {
  requiredFeatures: 35,
  budget: 25,
  preferences: 15,
  completeness: 15,
  category: 10,
} as const;

function searchableProductText(product: Product) {
  return [
    product.title,
    product.category,
    product.brand,
    product.description,
    ...product.features ?? [],
    ...Object.entries(product.specifications).flat(),
  ].filter(Boolean).join(" ").toLowerCase();
}

function matchesRequirement(product: Product, requirement: string) {
  const text = searchableProductText(product);
  return text.includes(requirement.toLowerCase().trim());
}

export function evaluateProduct(product: Product, intent: ShoppingIntent): ProductEvaluation {
  const requiredFeatureMatches = intent.requiredFeatures.filter((item) => matchesRequirement(product, item));
  const unmetRequirements = intent.requiredFeatures.filter((item) => !requiredFeatureMatches.includes(item));
  const unknownSpecifications = intent.requiredFeatures
    .filter((item) => !matchesRequirement(product, item))
    .filter((item) => !searchableProductText(product).includes(item.toLowerCase().split(" ")[0]));
  const preferenceMatches = intent.preferences.filter((item) => matchesRequirement(product, item));
  const budgetFit = !intent.budget
    ? "unknown"
    : product.price.currency !== intent.budget.currency
      ? "currency-mismatch"
      : product.price.amount <= intent.budget.amount
        ? "within"
        : "over";
  const fieldsPresent = [
    product.title,
    product.description,
    product.imageUrl,
    product.merchant,
    product.price.amount > 0 ? product.price.amount : undefined,
    Object.keys(product.specifications).length ? product.specifications : undefined,
    product.features?.length ? product.features : undefined,
    product.rating,
  ];
  const dataCompleteness = Math.round((fieldsPresent.filter(Boolean).length / fieldsPresent.length) * 100);
  const tradeoffs = [
    ...unmetRequirements.map((item) => `Required feature not found: ${item}.`),
    ...(budgetFit === "over" ? ["Price is above the stated budget."] : []),
    ...(budgetFit === "currency-mismatch" ? [`Price is in ${product.price.currency}; it was not compared with the ${intent.budget?.currency} budget.`] : []),
    ...(product.rating == null ? ["No rating was provided by Channel3."] : []),
    ...(Object.keys(product.specifications).length === 0 ? ["No structured specifications were provided by Channel3."] : []),
  ];
  const requiredScore = intent.requiredFeatures.length
    ? (requiredFeatureMatches.length / intent.requiredFeatures.length) * EVALUATION_WEIGHTS.requiredFeatures
    : EVALUATION_WEIGHTS.requiredFeatures;
  const budgetScore = budgetFit === "within"
    ? EVALUATION_WEIGHTS.budget
    : budgetFit === "unknown"
      ? EVALUATION_WEIGHTS.budget / 2
      : 0;
  const preferenceScore = intent.preferences.length
    ? (preferenceMatches.length / intent.preferences.length) * EVALUATION_WEIGHTS.preferences
    : EVALUATION_WEIGHTS.preferences / 2;
  const completenessScore = (dataCompleteness / 100) * EVALUATION_WEIGHTS.completeness;
  const categoryScore = intent.category && product.category.toLowerCase().includes(intent.category.toLowerCase())
    ? EVALUATION_WEIGHTS.category
    : intent.category ? 0 : EVALUATION_WEIGHTS.category / 2;
  return {
    productId: product.id,
    requiredFeatureMatches,
    unmetRequirements,
    unknownSpecifications,
    budgetFit,
    preferenceMatches,
    dataCompleteness,
    tradeoffs,
    score: Math.round(requiredScore + budgetScore + preferenceScore + completenessScore + categoryScore),
    evidence: [
      `Price: ${product.price.amount} ${product.price.currency}.`,
      ...(requiredFeatureMatches.length ? [`Matched requirements: ${requiredFeatureMatches.join(", ")}.`] : []),
      ...(preferenceMatches.length ? [`Matched preferences: ${preferenceMatches.join(", ")}.`] : []),
      `Data completeness: ${dataCompleteness}%.`,
    ],
  };
}

export function evaluateProducts(products: Product[], intent: ShoppingIntent) {
  return products
    .map((product) => evaluateProduct(product, intent))
    .sort((a, b) => b.score - a.score);
}
