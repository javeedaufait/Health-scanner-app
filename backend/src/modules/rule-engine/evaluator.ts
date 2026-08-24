import {
  UserProfile,
  NutritionValues,
  RuleEvaluationResult,
  EvaluationReason,
  AllergenWarning,
  HealthRule,
  AllergenRestrictionCode,
  evaluateFoodForUser as evaluateFoodForUserShared,
  EvaluateFoodInput as EvaluateFoodInputShared,
} from '@health-scanner/shared';

export type EvaluateFoodInput = EvaluateFoodInputShared;

export function evaluateFoodForUser(input: EvaluateFoodInput): RuleEvaluationResult {
  return evaluateFoodForUserShared(input);
}
