import {
  UserProfile,
  NutritionValues,
  RuleEvaluationResult,
  EvaluationReason,
  AllergenWarning,
  HealthRule,
  AllergenRestrictionCode,
  evaluateFoodForUser as evaluateFoodForUserShared,
} from '@health-scanner/shared';

export interface EvaluateFoodInput {
  userProfile: Partial<UserProfile>;
  productNutrition: NutritionValues;
  ingredientsList?: string[];
  detectedAllergens?: AllergenRestrictionCode[];
  customRules?: HealthRule[];
}

export function evaluateFoodForUser(input: EvaluateFoodInput): RuleEvaluationResult {
  return evaluateFoodForUserShared(input);
}
