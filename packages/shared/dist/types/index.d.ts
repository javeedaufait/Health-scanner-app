export type HealthConditionCode = 'none' | 'diabetes' | 'prediabetes' | 'hypertension' | 'high_cholesterol' | 'weight_management' | 'heart_health' | 'kidney_disease' | 'other';
export type DietaryPreferenceCode = 'none' | 'vegetarian' | 'vegan' | 'eggetarian';
export type AllergenRestrictionCode = 'milk' | 'lactose' | 'peanut' | 'tree_nuts' | 'soy' | 'wheat_gluten' | 'egg' | 'fish' | 'shellfish' | 'sesame';
export type AssessmentStatus = 'GOOD_CHOICE' | 'USE_CAUTION' | 'NOT_A_GOOD_CHOICE';
export type SeverityLevel = 'low' | 'moderate' | 'high' | 'critical';
export type RuleClassification = 'DIRECTLY_SUPPORTED' | 'INDIRECTLY_SUPPORTED' | 'HEURISTIC' | 'UNSUPPORTED' | 'CLINICAL_REVIEW_REQUIRED';
export interface HealthCondition {
    code: HealthConditionCode;
    nameEn: string;
    nameMl: string;
    descriptionEn: string;
    descriptionMl: string;
    isActive: boolean;
}
export interface DietaryRestriction {
    code: DietaryPreferenceCode | AllergenRestrictionCode;
    type: 'preference' | 'allergen';
    nameEn: string;
    nameMl: string;
    isActive: boolean;
}
export interface UserMedication {
    id?: string;
    medicineName: string;
    dosage?: string;
    frequency?: string;
}
export interface UserProfile {
    id: string;
    userId: string;
    name: string;
    age?: number;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    heightCm?: number;
    weightKg?: number;
    country: string;
    state: string;
    languagePreference: 'en' | 'ml';
    disclaimerAcknowledged: boolean;
    disclaimerAcknowledgedAt?: string;
    conditions: HealthConditionCode[];
    dietaryPreferences: DietaryPreferenceCode[];
    allergenRestrictions: AllergenRestrictionCode[];
    customRestrictions?: string[];
    medications: UserMedication[];
    createdAt: string;
    updatedAt: string;
}
export interface NutritionValues {
    energyKcal?: number | null;
    carbohydratesG?: number | null;
    sugarsG?: number | null;
    addedSugarsG?: number | null;
    proteinG?: number | null;
    fatG?: number | null;
    saturatedFatG?: number | null;
    transFatG?: number | null;
    fibreG?: number | null;
    sodiumMg?: number | null;
    saltG?: number | null;
}
export interface Product {
    id: string;
    barcode?: string;
    name: string;
    brand?: string;
    category?: string;
    servingSize?: string;
    servingSizeUnit?: string;
    imageUrl?: string;
    nutritionPer100g: NutritionValues;
    nutritionPerServing?: NutritionValues;
    ingredientsText?: string;
    ingredientsList: string[];
    detectedAllergens: AllergenRestrictionCode[];
    source: 'internal' | 'openfoodfacts' | 'ocr_extracted';
    sourceConfidence: number;
}
export interface EvaluationReason {
    ruleId?: string;
    conditionCode: string;
    nutrient: string;
    threshold?: number;
    unit?: string;
    classification?: RuleClassification;
    source?: string;
    severity: SeverityLevel;
    messageEn: string;
    messageMl: string;
    betterChoiceAdviceEn?: string;
    betterChoiceAdviceMl?: string;
}
export interface AllergenWarning {
    allergen: AllergenRestrictionCode | string;
    matchedIngredient: string;
    isDefinite: boolean;
    messageEn: string;
    messageMl: string;
}
export interface RuleEvaluationResult {
    status: AssessmentStatus;
    personalizedGuidanceScore: number;
    score: number;
    reasons: EvaluationReason[];
    allergenWarnings: AllergenWarning[];
    hasAllergenHazard: boolean;
    kidneyAdvisoryEn?: string;
    kidneyAdvisoryMl?: string;
    overallSummaryEn: string;
    overallSummaryMl: string;
    isMissingNutritionData: boolean;
    missingFields: string[];
}
export interface HealthRule {
    id: string;
    conditionCode: HealthConditionCode;
    nutrient: keyof NutritionValues;
    basis: 'per_100g' | 'per_serving';
    operator: '>' | '>=' | '<' | '<=';
    threshold: number;
    unit: 'g' | 'mg' | 'kcal';
    classification: RuleClassification;
    source: string;
    severity: SeverityLevel;
    deduction: number;
    messageEn: string;
    messageMl: string;
    adviceEn?: string;
    adviceMl?: string;
    isActive: boolean;
}
export interface ScanRecord {
    id: string;
    userId: string;
    productId: string;
    productName: string;
    brand?: string;
    scanType: 'barcode' | 'ocr_label';
    assessmentStatus: AssessmentStatus;
    score: number;
    personalizedGuidanceScore?: number;
    reasons: EvaluationReason[];
    allergenWarnings: AllergenWarning[];
    nutritionSnapshot: NutritionValues;
    aiExplanationEn?: string;
    aiExplanationMl?: string;
    createdAt: string;
}
//# sourceMappingURL=index.d.ts.map