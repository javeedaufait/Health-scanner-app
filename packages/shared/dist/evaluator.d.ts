import { UserProfile, NutritionValues, RuleEvaluationResult, HealthRule, AllergenRestrictionCode } from './types';
export interface EvaluateFoodInput {
    userProfile: Partial<UserProfile>;
    productNutrition: NutritionValues;
    ingredientsList?: string[];
    ingredientsText?: string;
    detectedAllergens?: AllergenRestrictionCode[];
    customRules?: HealthRule[];
}
export declare function evaluateFoodForUser(input: EvaluateFoodInput): RuleEvaluationResult;
//# sourceMappingURL=evaluator.d.ts.map