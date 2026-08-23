import {
  UserProfile,
  NutritionValues,
  RuleEvaluationResult,
  EvaluationReason,
  AllergenWarning,
  HealthRule,
  AllergenRestrictionCode,
} from './types';
import { MASTER_ALLERGENS, DEFAULT_HEURISTIC_RULES } from './constants';

// Common synonyms/derivatives for Indian food ingredient labels
const ALLERGEN_KEYWORD_MAP: Record<AllergenRestrictionCode, string[]> = {
  milk: ['milk', 'dairy', 'whey', 'casein', 'curd', 'ghee', 'butter', 'paneer', 'milk solids', 'milk powder', 'cream', 'lactose', 'cheese'],
  lactose: ['lactose', 'milk', 'milk solids', 'whey', 'milk powder'],
  peanut: ['peanut', 'peanuts', 'groundnut', 'groundnuts', 'peanut oil', 'arachis oil'],
  tree_nuts: ['almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'pecan', 'macadamia', 'kaju', 'badam', 'pista', 'akhrot'],
  soy: ['soy', 'soya', 'soybean', 'soy lecithin', 'tofu', 'soy protein'],
  wheat_gluten: ['wheat', 'gluten', 'maida', 'atta', 'semolina', 'suji', 'rava', 'wheat flour', 'refined wheat flour', 'spelt'],
  egg: ['egg', 'eggs', 'egg powder', 'albumin', 'egg yolk', 'egg white', 'ovalbumin'],
  fish: ['fish', 'salmon', 'tuna', 'anchovy', 'fish sauce', 'fish oil'],
  shellfish: ['prawn', 'prawns', 'shrimp', 'crab', 'lobster', 'shellfish', 'mollusc'],
  sesame: ['sesame', 'til', 'gingelly', 'sesame oil', 'sesame seeds', 'tahini'],
};

export interface EvaluateFoodInput {
  userProfile: Partial<UserProfile>;
  productNutrition: NutritionValues;
  ingredientsList?: string[];
  detectedAllergens?: AllergenRestrictionCode[];
  customRules?: HealthRule[];
}

export function evaluateFoodForUser(input: EvaluateFoodInput): RuleEvaluationResult {
  const {
    userProfile,
    productNutrition,
    ingredientsList = [],
    detectedAllergens = [],
    customRules = DEFAULT_HEURISTIC_RULES,
  } = input;

  const userConditions = userProfile.conditions || ['none'];
  const userAllergens = userProfile.allergenRestrictions || [];
  const userPreferences = userProfile.dietaryPreferences || ['none'];
  const customRestrictions = userProfile.customRestrictions || [];

  let baseScore = 100;
  const reasons: EvaluationReason[] = [];
  const allergenWarnings: AllergenWarning[] = [];
  const missingFields: string[] = [];

  // Check data completeness
  const keyFields: (keyof NutritionValues)[] = [
    'energyKcal',
    'carbohydratesG',
    'sugarsG',
    'proteinG',
    'fatG',
    'sodiumMg',
  ];
  for (const field of keyFields) {
    if (productNutrition[field] === null || productNutrition[field] === undefined) {
      missingFields.push(field);
    }
  }

  // 1. ALLERGEN & DIETARY RESTRICTION EVALUATION
  for (const allergen of userAllergens) {
    const allergenKeywords = ALLERGEN_KEYWORD_MAP[allergen] || [allergen.toLowerCase()];
    let matchedIngredient: string | null = null;

    // Check detected allergens tag
    if (detectedAllergens.includes(allergen)) {
      matchedIngredient = allergen;
    }

    // Check ingredients list
    if (!matchedIngredient && ingredientsList.length > 0) {
      for (const ingredient of ingredientsList) {
        const lower = ingredient.toLowerCase();
        for (const kw of allergenKeywords) {
          if (lower.includes(kw)) {
            matchedIngredient = ingredient.trim();
            break;
          }
        }
        if (matchedIngredient) break;
      }
    }

    if (matchedIngredient) {
      const allergenMeta = MASTER_ALLERGENS.find((a) => a.code === allergen);
      const nameEn = allergenMeta ? allergenMeta.nameEn : allergen;
      const nameMl = allergenMeta ? allergenMeta.nameMl : allergen;

      allergenWarnings.push({
        allergen,
        matchedIngredient,
        isDefinite: true,
        messageEn: `Contains ${nameEn}, which matches your marked restriction.`,
        messageMl: `നിങ്ങൾ ഒഴിവാക്കാൻ തിരഞ്ഞെടുത്ത ${nameMl} ഇതിൽ അടങ്ങിയിരിക്കുന്നു.`,
      });

      baseScore -= 45;
    }
  }

  // Check custom user restrictions
  for (const customRest of customRestrictions) {
    const trimmed = customRest.trim().toLowerCase();
    if (!trimmed) continue;

    for (const ingredient of ingredientsList) {
      if (ingredient.toLowerCase().includes(trimmed)) {
        allergenWarnings.push({
          allergen: customRest,
          matchedIngredient: ingredient.trim(),
          isDefinite: true,
          messageEn: `Contains "${ingredient.trim()}", which matches your custom restriction "${customRest}".`,
          messageMl: `നിങ്ങളുടെ പ്രത്യേക നിർദ്ദേശമായ "${customRest}" ഇതിൽ അടങ്ങിയിരിക്കുന്നു (${ingredient.trim()}).`,
        });
        baseScore -= 35;
        break;
      }
    }
  }

  // Vegetarian / Vegan checks
  if (userPreferences.includes('vegan') || userPreferences.includes('vegetarian')) {
    const nonVegKeywords = ['chicken', 'mutton', 'beef', 'pork', 'meat', 'gelatin', 'fish', 'prawn', 'crab', 'egg', 'lard'];
    if (userPreferences.includes('vegan')) {
      nonVegKeywords.push(...(ALLERGEN_KEYWORD_MAP.milk || []));
    }

    for (const ingredient of ingredientsList) {
      const lower = ingredient.toLowerCase();
      for (const kw of nonVegKeywords) {
        if (lower.includes(kw)) {
          allergenWarnings.push({
            allergen: userPreferences.includes('vegan') ? 'vegan_mismatch' : 'vegetarian_mismatch',
            matchedIngredient: ingredient.trim(),
            isDefinite: true,
            messageEn: `Contains non-plant/non-vegetarian ingredient: ${ingredient.trim()}`,
            messageMl: `സസ്യഭക്ഷണത്തിന് അനുയോജ്യമല്ലാത്ത ചേരുവ അടങ്ങിയിരിക്കുന്നു: ${ingredient.trim()}`,
          });
          baseScore -= 40;
          break;
        }
      }
    }
  }

  // 2. HEALTH CONDITIONS HEURISTIC EVALUATION
  const activeRules = customRules.filter((r) => r.isActive);

  for (const condition of userConditions) {
    if (condition === 'none') continue;

    if (condition === 'kidney_disease') {
      reasons.push({
        conditionCode: 'kidney_disease',
        nutrient: 'all',
        severity: 'high',
        messageEn: 'Kidney disease requires specialized clinical consultation. Always verify with your nephrologist/dietitian.',
        messageMl: 'വൃക്കരോഗമുള്ളവർ ഭക്ഷണ തിരഞ്ഞെടുപ്പുകൾക്ക് ഡോക്ടറുടെ പ്രത്യേക നിർദ്ദേശം തേടേണ്ടതാണ്.',
      });
      continue;
    }

    if (condition === 'other') {
      reasons.push({
        conditionCode: 'other',
        nutrient: 'general',
        severity: 'low',
        messageEn: 'We currently do not have validated heuristics for custom unlisted conditions. Please check with your doctor.',
        messageMl: 'ലിസ്റ്റ് ചെയ്യാത്ത മറ്റ് അസുഖങ്ങൾക്ക് പ്രത്യേക മാർഗ്ഗനിർദ്ദേശങ്ങൾ ലഭ്യമല്ല.',
      });
      continue;
    }

    // Evaluate rules for this condition
    const conditionRules = activeRules.filter((r) => r.conditionCode === condition);

    for (const rule of conditionRules) {
      const nutrientValue = productNutrition[rule.nutrient];
      if (nutrientValue === null || nutrientValue === undefined) {
        continue;
      }

      let isTriggered = false;
      switch (rule.operator) {
        case '>':
          isTriggered = nutrientValue > rule.threshold;
          break;
        case '>=':
          isTriggered = nutrientValue >= rule.threshold;
          break;
        case '<':
          isTriggered = nutrientValue < rule.threshold;
          break;
        case '<=':
          isTriggered = nutrientValue <= rule.threshold;
          break;
      }

      if (isTriggered) {
        const existingIdx = reasons.findIndex(
          (r) => r.conditionCode === condition && r.nutrient === rule.nutrient
        );
        if (existingIdx >= 0) {
          if (rule.deduction > (reasons[existingIdx] as any).deduction) {
            baseScore -= (rule.deduction - (reasons[existingIdx] as any).deduction);
            reasons[existingIdx] = {
              conditionCode: rule.conditionCode,
              nutrient: String(rule.nutrient),
              severity: rule.severity,
              messageEn: rule.messageEn,
              messageMl: rule.messageMl,
              betterChoiceAdviceEn: rule.adviceEn,
              betterChoiceAdviceMl: rule.adviceMl,
            };
          }
        } else {
          baseScore -= rule.deduction;
          reasons.push({
            conditionCode: rule.conditionCode,
            nutrient: String(rule.nutrient),
            severity: rule.severity,
            messageEn: rule.messageEn,
            messageMl: rule.messageMl,
            betterChoiceAdviceEn: rule.adviceEn,
            betterChoiceAdviceMl: rule.adviceMl,
          });
        }
      }
    }
  }

  // 3. SCORE CLAMPING & STATUS ASSIGNMENT
  const finalScore = Math.max(0, Math.min(100, Math.round(baseScore)));

  const hasCriticalAllergen = allergenWarnings.some((a) => a.isDefinite);
  const hasCriticalReason = reasons.some((r) => r.severity === 'critical');
  const hasHighReason = reasons.some((r) => r.severity === 'high');

  let status: 'GOOD_CHOICE' | 'USE_CAUTION' | 'NOT_A_GOOD_CHOICE';

  if (hasCriticalAllergen || finalScore < 50) {
    status = 'NOT_A_GOOD_CHOICE';
  } else if (hasCriticalReason || hasHighReason || finalScore < 80) {
    status = 'USE_CAUTION';
  } else {
    status = 'GOOD_CHOICE';
  }

  // 4. OVERALL SUMMARY GENERATION
  let overallSummaryEn = '';
  let overallSummaryMl = '';

  if (status === 'NOT_A_GOOD_CHOICE') {
    if (hasCriticalAllergen) {
      overallSummaryEn = 'Contains ingredients matching your allergen/dietary restrictions. Not recommended.';
      overallSummaryMl = 'നിങ്ങൾ ഒഴിവാക്കാൻ ആഗ്രഹിച്ച ചേരുവകൾ ഇതിൽ അടങ്ങിയിരിക്കുന്നു. ഇത് ഉപയോഗിക്കാതിരിക്കാൻ ശ്രദ്ധിക്കുക.';
    } else {
      overallSummaryEn = 'Nutrient levels may not be suitable for your health profile goals. Look for healthier alternatives.';
      overallSummaryMl = 'നിങ്ങളുടെ ആരോഗ്യ ആവശ്യങ്ങൾക്ക് ഈ ഉൽപ്പന്നം അനുയോജ്യമല്ല. കുറഞ്ഞ പഞ്ചസാരയും ഉപ്പുമുള്ള മറ്റ് ഉൽപ്പന്നങ്ങൾ തിരഞ്ഞെടുക്കുക.';
    }
  } else if (status === 'USE_CAUTION') {
    overallSummaryEn = 'Contains some nutrients to consume in moderation based on your health profile.';
    overallSummaryMl = 'നിങ്ങളുടെ ആരോഗ്യ പ്രൊഫൈൽ അനുസരിച്ച് ഇത് മിതമായ അളവിൽ മാത്രം ഉപയോഗിക്കുക.';
  } else {
    overallSummaryEn = 'Fits well with your health profile and dietary preferences.';
    overallSummaryMl = 'നിങ്ങളുടെ ആരോഗ്യ ലക്ഷ്യങ്ങൾക്കും മുൻഗണനകൾക്കും അനുയോജ്യമായ ഉൽപ്പന്നം.';
  }

  return {
    status,
    score: finalScore,
    reasons,
    allergenWarnings,
    overallSummaryEn,
    overallSummaryMl,
    isMissingNutritionData: missingFields.length > 2,
    missingFields,
  };
}
