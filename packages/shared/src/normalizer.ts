import {
  NutritionValues,
  RawServingInfo,
  RawNutrientEntry,
  NutritionNormalizationResult,
} from './types';

export function parseServingSizeGrams(servingSizeText?: string | null): number | null {
  if (!servingSizeText) return null;

  const text = servingSizeText.trim().toLowerCase();
  if (!text) return null;

  // Match explicitly stated gram patterns e.g. "30g", "30 g", "30grams", "1 scoop (25g)"
  const gMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|grams)\b/);
  if (gMatch && gMatch[1]) {
    const val = parseFloat(gMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  // Match ml patterns e.g. "250 ml", "250ml" (assuming 1ml ~= 1g density fallback)
  const mlMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:ml|milliliter|milliliters)\b/);
  if (mlMatch && mlMatch[1]) {
    const val = parseFloat(mlMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  // Pure number pattern e.g. "30"
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    const val = parseFloat(text);
    if (!isNaN(val) && val > 0) return val;
  }

  // Ambiguous format without weight e.g. "1 biscuit", "1 piece", "serving"
  return null;
}

export interface NormalizeInput {
  nutritionPer100g?: NutritionValues | null;
  nutritionPerServing?: NutritionValues | null;
  servingInfo?: RawServingInfo | null;
}

export function normalizeNutritionData(input: NormalizeInput): NutritionNormalizationResult {
  const { nutritionPer100g, nutritionPerServing, servingInfo } = input;

  const parsedServingSizeGrams =
    servingInfo?.servingSizeGrams ??
    parseServingSizeGrams(servingInfo?.servingSizeText);

  const effectiveServingInfo: RawServingInfo = {
    servingSizeGrams: parsedServingSizeGrams,
    servingSizeMl: servingInfo?.servingSizeMl ?? null,
    servingSizeText: servingInfo?.servingSizeText ?? null,
    basis: servingInfo?.basis ?? (nutritionPer100g ? 'per_100g' : 'per_serving'),
  };

  const normalizedPer100g: NutritionValues = {};
  const originalSnapshot: Record<string, RawNutrientEntry> = {};
  const missingOrAmbiguousFields: string[] = [];
  let conversionApplied = false;

  const keyNutrients: (keyof NutritionValues)[] = [
    'energyKcal',
    'carbohydratesG',
    'sugarsG',
    'addedSugarsG',
    'proteinG',
    'fatG',
    'saturatedFatG',
    'transFatG',
    'fibreG',
    'sodiumMg',
    'saltG',
  ];

  for (const key of keyNutrients) {
    const val100g = nutritionPer100g ? nutritionPer100g[key] : undefined;
    const valServing = nutritionPerServing ? nutritionPerServing[key] : undefined;

    // Case 1: Per-100g value is directly present
    if (val100g !== undefined && val100g !== null && !isNaN(val100g)) {
      normalizedPer100g[key] = val100g;
      originalSnapshot[key] = {
        value: val100g,
        unit: key === 'energyKcal' ? 'kcal' : key === 'sodiumMg' ? 'mg' : 'g',
        basis: 'per_100g',
      };
      continue;
    }

    // Case 2: Per-serving value is available
    if (valServing !== undefined && valServing !== null && !isNaN(valServing)) {
      originalSnapshot[key] = {
        value: valServing,
        unit: key === 'energyKcal' ? 'kcal' : key === 'sodiumMg' ? 'mg' : 'g',
        basis: 'per_serving',
      };

      // Convert per-serving to per-100g if valid serving size in grams is available
      if (parsedServingSizeGrams && parsedServingSizeGrams > 0) {
        const converted = Number(((valServing / parsedServingSizeGrams) * 100).toFixed(2));
        normalizedPer100g[key] = converted;
        conversionApplied = true;
      } else {
        // Missing or ambiguous serving size -> set normalized value to UNKNOWN/null. NEVER estimate!
        normalizedPer100g[key] = null;
        missingOrAmbiguousFields.push(key);
      }
      continue;
    }

    // Case 3: Neither per-100g nor per-serving value is present
    normalizedPer100g[key] = null;
    missingOrAmbiguousFields.push(key);
  }

  return {
    normalizedPer100g,
    originalSnapshot,
    servingInfo: effectiveServingInfo,
    conversionApplied,
    missingOrAmbiguousFields,
  };
}
