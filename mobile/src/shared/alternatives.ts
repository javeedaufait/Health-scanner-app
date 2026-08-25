import { Product, UserProfile, RuleEvaluationResult, NutritionValues } from './types';
import { evaluateFoodForUser } from './evaluator';

export interface BetterAlternativeItem {
  product: Product;
  evaluation: RuleEvaluationResult;
  comparisonReasonsEn: string[];
  comparisonReasonsMl: string[];
  guidanceBadgeEn: string; // "Better fit for your profile"
  guidanceBadgeMl: string; // "നിങ്ങളുടെ പ്രൊഫൈലിന് കൂടുതൽ അനുയോജ്യം"
}

export interface BetterAlternativesResult {
  hasAlternatives: boolean;
  alternatives: BetterAlternativeItem[];
  emptyMessageEn?: string;
  emptyMessageMl?: string;
}

/**
 * Normalizes category strings for broad category grouping (e.g. "Biscuits, Cookies" -> "biscuits")
 */
function normalizeCategory(category?: string): string {
  if (!category) return 'packaged_food';
  const c = category.toLowerCase();
  if (c.includes('biscuit') || c.includes('cookie') || c.includes('cracker')) return 'biscuits';
  if (c.includes('noodle') || c.includes('pasta') || c.includes('ramen') || c.includes('macaroni')) return 'noodles';
  if (c.includes('chip') || c.includes('snack') || c.includes('crisp') || c.includes('namkeen') || c.includes('bhujia')) return 'snacks';
  if (c.includes('cereal') || c.includes('oat') || c.includes('muesli') || c.includes('flake') || c.includes('granola')) return 'cereals';
  if (c.includes('milk') || c.includes('yogurt') || c.includes('curd') || c.includes('dairy') || c.includes('paneer') || c.includes('cheese')) return 'dairy';
  if (c.includes('beverage') || c.includes('drink') || c.includes('soda') || c.includes('juice') || c.includes('cola') || c.includes('tea') || c.includes('coffee')) return 'beverages';
  if (c.includes('oil') || c.includes('ghee') || c.includes('butter') || c.includes('fat')) return 'fats_oils';
  return c.split(',')[0].trim();
}

/**
 * Generates 1–2 concrete comparative metrics comparing candidate against the scanned product
 */
function generateComparisonReasons(
  candidateNutr: NutritionValues,
  currentNutr: NutritionValues
): { en: string[]; ml: string[] } {
  const en: string[] = [];
  const ml: string[] = [];

  // 1. Added Sugar / Total Sugar Comparison
  const candSugar = candidateNutr.addedSugarsG ?? candidateNutr.sugarsG;
  const currSugar = currentNutr.addedSugarsG ?? currentNutr.sugarsG;
  if (candSugar != null && currSugar != null && currSugar > candSugar && (currSugar - candSugar >= 1.0)) {
    const diff = (currSugar - candSugar).toFixed(1);
    en.push(`Lower sugar: ${candSugar}g vs ${currSugar}g/100g (${diff}g less)`);
    ml.push(`പഞ്ചസാര കുറവ്: 100 ഗ്രാമിൽ ${candSugar}g (നിലവിലുള്ളതിൽ ${currSugar}g)`);
  }

  // 2. Sodium / Salt Comparison
  const candSodium = candidateNutr.sodiumMg;
  const currSodium = currentNutr.sodiumMg;
  if (candSodium != null && currSodium != null && currSodium > candSodium && (currSodium - candSodium >= 100)) {
    const diff = Math.round(currSodium - candSodium);
    en.push(`Lower sodium: ${candSodium}mg vs ${currSodium}mg/100g (${diff}mg less)`);
    ml.push(`സോഡിയം കുറവ്: 100 ഗ്രാമിൽ ${candSodium}mg (നിലവിലുള്ളതിൽ ${currSodium}mg)`);
  }

  // 3. Saturated Fat Comparison
  const candSatFat = candidateNutr.saturatedFatG;
  const currSatFat = currentNutr.saturatedFatG;
  if (candSatFat != null && currSatFat != null && currSatFat > candSatFat && (currSatFat - candSatFat >= 1.0)) {
    const diff = (currSatFat - candSatFat).toFixed(1);
    en.push(`Lower saturated fat: ${candSatFat}g vs ${currSatFat}g/100g (${diff}g less)`);
    ml.push(`പൂരിത കൊഴുപ്പ് കുറവ്: 100 ഗ്രാമിൽ ${candSatFat}g (നിലവിലുള്ളതിൽ ${currSatFat}g)`);
  }

  // 4. Dietary Fibre Comparison (Higher is better)
  const candFibre = candidateNutr.fibreG;
  const currFibre = currentNutr.fibreG;
  if (candFibre != null && currFibre != null && candFibre > currFibre && (candFibre - currFibre >= 1.0)) {
    const diff = (candFibre - currFibre).toFixed(1);
    en.push(`Higher dietary fibre: ${candFibre}g vs ${currFibre}g/100g (${diff}g more)`);
    ml.push(`കൂടുതൽ നാരുകൾ: 100 ഗ്രാമിൽ ${candFibre}g (നിലവിലുള്ളതിൽ ${currFibre}g)`);
  }

  // Fallback generic reason if nutrients are identical/not different enough
  if (en.length === 0) {
    en.push('Better overall nutritional benchmark alignment for your profile');
    ml.push('നിങ്ങളുടെ ആരോഗ്യ പ്രൊഫൈലിന് കൂടുതൽ അനുയോജ്യമായ ഘടന');
  }

  return {
    en: en.slice(0, 2),
    ml: ml.slice(0, 2),
  };
}

/**
 * Finds up to 3 candidate products in the same/related category that are a "Better fit for your profile"
 */
export function findBetterAlternatives(params: {
  currentProduct: {
    id?: string;
    barcode?: string;
    category?: string;
    nutrition: NutritionValues;
  };
  candidateProducts: Product[];
  userProfile: Partial<UserProfile>;
  currentEvaluation?: RuleEvaluationResult;
}): BetterAlternativesResult {
  const { currentProduct, candidateProducts, userProfile, currentEvaluation } = params;

  if (!candidateProducts || candidateProducts.length === 0) {
    return {
      hasAlternatives: false,
      alternatives: [],
      emptyMessageEn: 'No suitable alternatives found yet.',
      emptyMessageMl: 'അനുയോജ്യമായ മറ്റ് ഉൽപ്പന്നങ്ങൾ ഇപ്പോൾ ലഭ്യമല്ല.',
    };
  }

  const currentCategoryNorm = normalizeCategory(currentProduct.category);
  const currentScore = currentEvaluation?.personalizedGuidanceScore ?? 50;

  // 1. Filter matching candidates
  const eligibleCandidates: { product: Product; evaluation: RuleEvaluationResult }[] = [];

  for (const prod of candidateProducts) {
    // Exclude current product
    if (currentProduct.id && prod.id === currentProduct.id) continue;
    if (currentProduct.barcode && prod.barcode === currentProduct.barcode) continue;

    // Check category match
    const prodCategoryNorm = normalizeCategory(prod.category);
    if (prodCategoryNorm !== currentCategoryNorm && prodCategoryNorm !== 'packaged_food') {
      continue;
    }

    // Exclude products with missing nutrition facts
    const hasNutrition = Object.values(prod.nutritionPer100g || {}).some((v) => v !== null && v !== undefined);
    if (!hasNutrition) continue;

    // Evaluate product with rule engine
    const evaluation = evaluateFoodForUser({
      userProfile,
      productNutrition: prod.nutritionPer100g,
      ingredientsList: prod.ingredientsList,
      detectedAllergens: prod.detectedAllergens,
    });

    // Exclude allergen conflicts
    if (evaluation.hasAllergenHazard) continue;

    // Must be better fit for user (higher score or better status)
    if (evaluation.personalizedGuidanceScore > currentScore || (currentEvaluation?.status === 'NOT_A_GOOD_CHOICE' && evaluation.status !== 'NOT_A_GOOD_CHOICE')) {
      eligibleCandidates.push({ product: prod, evaluation });
    }
  }

  // 2. Rank candidates
  eligibleCandidates.sort((a, b) => {
    const statusRank = { GOOD_CHOICE: 3, USE_CAUTION: 2, NOT_A_GOOD_CHOICE: 1 };
    const aStatus = statusRank[a.evaluation.status] || 0;
    const bStatus = statusRank[b.evaluation.status] || 0;

    if (aStatus !== bStatus) {
      return bStatus - aStatus;
    }
    return b.evaluation.personalizedGuidanceScore - a.evaluation.personalizedGuidanceScore;
  });

  // 3. Take top 3
  const top3 = eligibleCandidates.slice(0, 3);

  if (top3.length === 0) {
    return {
      hasAlternatives: false,
      alternatives: [],
      emptyMessageEn: 'No suitable alternatives found yet.',
      emptyMessageMl: 'അനുയോജ്യമായ മറ്റ് ഉൽപ്പന്നങ്ങൾ ഇപ്പോൾ ലഭ്യമല്ല.',
    };
  }

  const alternatives: BetterAlternativeItem[] = top3.map(({ product, evaluation }) => {
    const reasons = generateComparisonReasons(product.nutritionPer100g, currentProduct.nutrition);
    return {
      product,
      evaluation,
      comparisonReasonsEn: reasons.en,
      comparisonReasonsMl: reasons.ml,
      guidanceBadgeEn: 'Better fit for your profile',
      guidanceBadgeMl: 'നിങ്ങളുടെ പ്രൊഫൈലിന് കൂടുതൽ അനുയോജ്യം',
    };
  });

  return {
    hasAlternatives: true,
    alternatives,
  };
}
