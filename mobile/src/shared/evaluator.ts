import {
  UserProfile,
  NutritionValues,
  RuleEvaluationResult,
  EvaluationReason,
  AllergenWarning,
  HealthRule,
  AllergenRestrictionCode,
} from './types';
import { MASTER_ALLERGENS, DEFAULT_HEURISTIC_RULES, RULE_SET_VERSION } from './constants';

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

  const allergenWarnings: AllergenWarning[] = [];
  const reasons: EvaluationReason[] = [];
  const missingFields: string[] = [];

  // Check missing nutrition fields (null or undefined)
  const keyFields: (keyof NutritionValues)[] = [
    'energyKcal',
    'carbohydratesG',
    'sugarsG',
    'addedSugarsG',
    'proteinG',
    'fatG',
    'saturatedFatG',
    'transFatG',
    'sodiumMg',
  ];

  for (const field of keyFields) {
    if (productNutrition[field] === null || productNutrition[field] === undefined) {
      missingFields.push(field);
    }
  }

  // =========================================================================
  // PATH 1: ALLERGEN & BIOLOGICAL SAFETY ENGINE (Independent Safety Warnings)
  // =========================================================================
  for (const allergen of userAllergens) {
    const allergenKeywords = ALLERGEN_KEYWORD_MAP[allergen] || [allergen.toLowerCase()];
    let matchedIngredient: string | null = null;

    if (detectedAllergens.includes(allergen)) {
      matchedIngredient = allergen;
    }

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
        messageEn: `Safety Warning: Contains ${nameEn}, matching your allergen restriction.`,
        messageMl: `മുന്നറിയിപ്പ്: നിങ്ങൾ ഒഴിവാക്കാൻ ആഗ്രഹിച്ച ${nameMl} ഇതിൽ അടങ്ങിയിരിക്കുന്നു.`,
      });
    }
  }

  // Custom ingredient restrictions
  for (const customRest of customRestrictions) {
    const trimmed = customRest.trim().toLowerCase();
    if (!trimmed) continue;

    for (const ingredient of ingredientsList) {
      if (ingredient.toLowerCase().includes(trimmed)) {
        allergenWarnings.push({
          allergen: customRest,
          matchedIngredient: ingredient.trim(),
          isDefinite: true,
          messageEn: `Custom Restriction: Contains "${ingredient.trim()}", matching your entry "${customRest}".`,
          messageMl: `നിങ്ങളുടെ നിർദ്ദേശമായ "${customRest}" ഇതിൽ അടങ്ങിയിരിക്കുന്നു (${ingredient.trim()}).`,
        });
        break;
      }
    }
  }

  // Vegetarian / Vegan preferences
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
            messageEn: `Dietary Preference Alert: Contains non-plant/non-vegetarian ingredient (${ingredient.trim()}).`,
            messageMl: `സസ്യഭക്ഷണത്തിന് അനുയോജ്യമല്ലാത്ത ചേരുവ അടങ്ങിയിരിക്കുന്നു: ${ingredient.trim()}`,
          });
          break;
        }
      }
    }
  }

  const hasAllergenHazard = allergenWarnings.length > 0;

  // =========================================================================
  // PATH 2: NUTRIENT GUIDANCE ENGINE (Personalized Guidance Score 0–100)
  // =========================================================================
  let baseScore = 100;
  let kidneyAdvisoryEn: string | undefined;
  let kidneyAdvisoryMl: string | undefined;

  const activeRules = customRules.filter((r) => r.isActive);

  for (const condition of userConditions) {
    if (condition === 'none') continue;

    if (condition === 'kidney_disease') {
      kidneyAdvisoryEn = 'Kidney disease requires personalized clinical management. Please consult your nephrologist or renal dietitian for specialized dietary limits.';
      kidneyAdvisoryMl = 'വൃക്കരോഗമുള്ളവർ ഭക്ഷണ കാര്യങ്ങളിൽ ഡോക്ടറുടെയോ ഡയറ്റീഷ്യന്റെയോ വ്യക്തിഗത നിർദ്ദേശങ്ങൾ സ്വീകരിക്കേണ്ടതാണ്.';
      continue;
    }

    if (condition === 'other') {
      reasons.push({
        conditionCode: 'other',
        nutrient: 'general',
        severity: 'low',
        messageEn: 'Unlisted condition selected. Please review nutrient values with your physician.',
        messageMl: 'ലിസ്റ്റ് ചെയ്യാത്ത മറ്റ് ആരോഗ്യ പ്രൊഫൈലുകൾക്ക് ഡോക്ടറുടെ സേവനം തേടുക.',
      });
      continue;
    }

    const conditionRules = activeRules.filter((r) => r.conditionCode === condition);

    for (const rule of conditionRules) {
      const nutrientValue = productNutrition[rule.nutrient];
      if (nutrientValue === null || nutrientValue === undefined) {
        // Skip missing nutrient values (treated as UNKNOWN, no false score penalty)
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
          const prevDeduction = (reasons[existingIdx] as any).deduction || 0;
          if (rule.deduction > prevDeduction) {
            baseScore -= (rule.deduction - prevDeduction);
            reasons[existingIdx] = {
              ruleId: rule.id,
              conditionCode: rule.conditionCode,
              nutrient: String(rule.nutrient),
              threshold: rule.threshold,
              unit: rule.unit,
              classification: rule.classification,
              source: rule.source,
              severity: rule.severity,
              messageEn: rule.messageEn,
              messageMl: rule.messageMl,
              betterChoiceAdviceEn: rule.adviceEn,
              betterChoiceAdviceMl: rule.adviceMl,
              ...({ deduction: rule.deduction } as any),
            };
          }
        } else {
          baseScore -= rule.deduction;
          reasons.push({
            ruleId: rule.id,
            conditionCode: rule.conditionCode,
            nutrient: String(rule.nutrient),
            threshold: rule.threshold,
            unit: rule.unit,
            classification: rule.classification,
            source: rule.source,
            severity: rule.severity,
            messageEn: rule.messageEn,
            messageMl: rule.messageMl,
            betterChoiceAdviceEn: rule.adviceEn,
            betterChoiceAdviceMl: rule.adviceMl,
            ...({ deduction: rule.deduction } as any),
          });
        }
      }
    }
  }

  const personalizedGuidanceScore = Math.max(0, Math.min(100, Math.round(baseScore)));

  const hasCriticalReason = reasons.some((r) => r.severity === 'critical');
  const hasHighReason = reasons.some((r) => r.severity === 'high');

  let status: 'GOOD_CHOICE' | 'USE_CAUTION' | 'NOT_A_GOOD_CHOICE';

  if (hasAllergenHazard || personalizedGuidanceScore < 50) {
    status = 'NOT_A_GOOD_CHOICE';
  } else if (hasCriticalReason || hasHighReason || personalizedGuidanceScore < 80) {
    status = 'USE_CAUTION';
  } else {
    status = 'GOOD_CHOICE';
  }

  let overallSummaryEn = '';
  let overallSummaryMl = '';

  if (status === 'NOT_A_GOOD_CHOICE') {
    if (hasAllergenHazard) {
      overallSummaryEn = 'Allergen / dietary restriction hazard detected. Not recommended for your safety.';
      overallSummaryMl = 'നിങ്ങൾ ഒഴിവാക്കാൻ തിരഞ്ഞെടുത്ത ചേരുവകൾ ഇതിൽ അടങ്ങിയിരിക്കുന്നു. ഇത് ഒഴിവാക്കാൻ ശ്രദ്ധിക്കുക.';
    } else {
      overallSummaryEn = 'Nutrient levels exceed target limits for your selected health profile.';
      overallSummaryMl = 'നിങ്ങളുടെ ആരോഗ്യ ആവശ്യങ്ങൾക്ക് ഈ ഉൽപ്പന്നത്തിലെ പോഷകങ്ങളുടെ അളവ് അനുയോജ്യമല്ല.';
    }
  } else if (status === 'USE_CAUTION') {
    overallSummaryEn = 'Contains specific nutrients to consume in moderation according to your selected goals.';
    overallSummaryMl = 'നിങ്ങളുടെ ആരോഗ്യ പ്രൊഫൈൽ അനുസരിച്ച് ഇത് മിതമായ അളവിൽ മാത്രം ഉപയോഗിക്കുക.';
  } else {
    overallSummaryEn = 'Fits well with your health profile and dietary preferences.';
    overallSummaryMl = 'നിങ്ങളുടെ ആരോഗ്യ ലക്ഷ്യങ്ങൾക്കും മുൻഗണനകൾക്കും അനുയോജ്യമായ ഉൽപ്പന്നം.';
  }

  return {
    ruleSetVersion: RULE_SET_VERSION,
    status,
    personalizedGuidanceScore,
    score: personalizedGuidanceScore, // Deprecated alias for backwards compatibility
    reasons,
    allergenWarnings,
    hasAllergenHazard,
    kidneyAdvisoryEn,
    kidneyAdvisoryMl,
    overallSummaryEn,
    overallSummaryMl,
    isMissingNutritionData: missingFields.length > 0,
    missingFields,
  };
}
