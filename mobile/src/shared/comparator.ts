import { Product, UserProfile, RuleEvaluationResult } from './types';
import { evaluateFoodForUser } from './evaluator';

export interface ProductComparisonItem {
  product: Product;
  evaluation: RuleEvaluationResult;
  rank: number; // 1 = Best choice, 2 = Second best, 3 = Third best
  isWinner: boolean;
}

export interface ProductComparisonResult {
  items: ProductComparisonItem[];
  winnerProductId: string | null;
  comparisonHighlightsEn: string[];
  comparisonHighlightsMl: string[];
}

export function compareProductsForUser(
  products: Product[],
  userProfile: Partial<UserProfile>
): ProductComparisonResult {
  if (!products || products.length === 0) {
    return {
      items: [],
      winnerProductId: null,
      comparisonHighlightsEn: ['No products selected for comparison.'],
      comparisonHighlightsMl: ['താരതമ്യം ചെയ്യാൻ ഉൽപ്പന്നങ്ങൾ തിരഞ്ഞെടുത്തിട്ടില്ല.'],
    };
  }

  // 1. Evaluate each product independently using audited rule engine
  const evaluatedItems: { product: Product; evaluation: RuleEvaluationResult }[] = products.map((product) => {
    const evaluation = evaluateFoodForUser({
      userProfile,
      productNutrition: product.nutritionPer100g,
      ingredientsList: product.ingredientsList,
      detectedAllergens: product.detectedAllergens,
    });
    return { product, evaluation };
  });

  // 2. Sort/Rank items:
  // - Priority 1: Biological Allergen Hazards (hasAllergenHazard false > true)
  // - Priority 2: Status (GOOD_CHOICE > USE_CAUTION > NOT_A_GOOD_CHOICE)
  // - Priority 3: Personalized Guidance Score (Higher score is better)
  const sorted = [...evaluatedItems].sort((a, b) => {
    if (a.evaluation.hasAllergenHazard !== b.evaluation.hasAllergenHazard) {
      return a.evaluation.hasAllergenHazard ? 1 : -1;
    }

    const statusScore = { GOOD_CHOICE: 3, USE_CAUTION: 2, NOT_A_GOOD_CHOICE: 1 };
    const aStatus = statusScore[a.evaluation.status] || 0;
    const bStatus = statusScore[b.evaluation.status] || 0;

    if (aStatus !== bStatus) {
      return bStatus - aStatus;
    }

    return b.evaluation.personalizedGuidanceScore - a.evaluation.personalizedGuidanceScore;
  });

  const winnerProductId = sorted.length > 0 ? sorted[0].product.id : null;

  const items: ProductComparisonItem[] = evaluatedItems.map((item) => {
    const rankIndex = sorted.findIndex((s) => s.product.id === item.product.id);
    const rank = rankIndex >= 0 ? rankIndex + 1 : 1;
    const isWinner = item.product.id === winnerProductId;

    return {
      product: item.product,
      evaluation: item.evaluation,
      rank,
      isWinner,
    };
  });

  // 3. Generate Comparative Highlights
  const comparisonHighlightsEn: string[] = [];
  const comparisonHighlightsMl: string[] = [];

  if (items.length >= 2) {
    const best = sorted[0];
    const second = sorted[1];

    if (best.evaluation.hasAllergenHazard === false && second.evaluation.hasAllergenHazard === true) {
      comparisonHighlightsEn.push(
        `🏆 "${best.product.name}" is safer for your profile because "${second.product.name}" contains matched allergen restrictions.`
      );
      comparisonHighlightsMl.push(
        `🏆 "${best.product.name}" നിങ്ങളുടെ പ്രൊഫൈലിന് കൂടുതൽ സുരക്ഷിതമാണ്. "${second.product.name}" ൽ നിങ്ങൾ ഒഴിവാക്കിയ ചേരുവകൾ അടങ്ങിയിരിക്കുന്നു.`
      );
    } else {
      const bestSugar = best.product.nutritionPer100g.addedSugarsG ?? best.product.nutritionPer100g.sugarsG;
      const secondSugar = second.product.nutritionPer100g.addedSugarsG ?? second.product.nutritionPer100g.sugarsG;

      if (bestSugar != null && secondSugar != null && secondSugar > bestSugar && bestSugar >= 0) {
        const diffG = (secondSugar - bestSugar).toFixed(1);
        comparisonHighlightsEn.push(
          `💡 "${best.product.name}" has ${diffG}g less sugar per 100g than "${second.product.name}".`
        );
        comparisonHighlightsMl.push(
          `💡 "${best.product.name}" ൽ 100 ഗ്രാമിൽ ${diffG}g കുറവ് പഞ്ചസാരയാണുള്ളത്.`
        );
      }

      const bestSodium = best.product.nutritionPer100g.sodiumMg;
      const secondSodium = second.product.nutritionPer100g.sodiumMg;

      if (bestSodium != null && secondSodium != null && secondSodium > bestSodium) {
        const diffSodium = Math.round(secondSodium - bestSodium);
        comparisonHighlightsEn.push(
          `🧂 "${best.product.name}" contains ${diffSodium}mg less sodium per 100g than "${second.product.name}".`
        );
        comparisonHighlightsMl.push(
          `🧂 "${best.product.name}" ൽ 100 ഗ്രാമിൽ ${diffSodium}mg കുറവ് സോഡിയമാണ് അടങ്ങിയിരിക്കുന്നത്.`
        );
      }
    }
  }

  if (comparisonHighlightsEn.length === 0 && sorted.length > 0) {
    comparisonHighlightsEn.push(
      `🏆 "${sorted[0].product.name}" achieved the highest Personalized Guidance Score (${sorted[0].evaluation.personalizedGuidanceScore}/100) for your health profile.`
    );
    comparisonHighlightsMl.push(
      `🏆 "${sorted[0].product.name}" നിങ്ങളുടെ ഹെൽത്ത് പ്രൊഫൈലിന് ഏറ്റവും ഉയർന്ന സ്കോർ നേടുന്നു (${sorted[0].evaluation.personalizedGuidanceScore}/100).`
    );
  }

  return {
    items,
    winnerProductId,
    comparisonHighlightsEn,
    comparisonHighlightsMl,
  };
}
