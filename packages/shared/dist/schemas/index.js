"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluateFoodRequestSchema = exports.ProductSchema = exports.ExtractedLabelNutritionSchema = exports.NutritionValuesSchema = exports.UpdateHealthProfileSchema = exports.UpdateProfileSchema = exports.UserMedicationSchema = exports.LoginUserSchema = exports.RegisterUserSchema = exports.AllergenRestrictionCodeSchema = exports.DietaryPreferenceCodeSchema = exports.HealthConditionCodeSchema = void 0;
const zod_1 = require("zod");
exports.HealthConditionCodeSchema = zod_1.z.enum([
    'none',
    'diabetes',
    'prediabetes',
    'hypertension',
    'high_cholesterol',
    'weight_management',
    'heart_health',
    'kidney_disease',
    'other',
]);
exports.DietaryPreferenceCodeSchema = zod_1.z.enum([
    'none',
    'vegetarian',
    'vegan',
    'eggetarian',
]);
exports.AllergenRestrictionCodeSchema = zod_1.z.enum([
    'milk',
    'lactose',
    'peanut',
    'tree_nuts',
    'soy',
    'wheat_gluten',
    'egg',
    'fish',
    'shellfish',
    'sesame',
]);
exports.RegisterUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please enter a valid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
});
exports.LoginUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.UserMedicationSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    medicineName: zod_1.z.string().min(1, 'Medicine name is required'),
    dosage: zod_1.z.string().optional(),
    frequency: zod_1.z.string().optional(),
});
exports.UpdateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    age: zod_1.z.number().int().min(1).max(125).optional().nullable(),
    gender: zod_1.z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().nullable(),
    heightCm: zod_1.z.number().positive().optional().nullable(),
    weightKg: zod_1.z.number().positive().optional().nullable(),
    country: zod_1.z.string().default('India'),
    state: zod_1.z.string().default('Kerala'),
    languagePreference: zod_1.z.enum(['en', 'ml']).default('en'),
});
exports.UpdateHealthProfileSchema = zod_1.z.object({
    conditions: zod_1.z.array(exports.HealthConditionCodeSchema),
    dietaryPreferences: zod_1.z.array(exports.DietaryPreferenceCodeSchema),
    allergenRestrictions: zod_1.z.array(exports.AllergenRestrictionCodeSchema),
    customRestrictions: zod_1.z.array(zod_1.z.string().max(100)).optional(),
    medications: zod_1.z.array(exports.UserMedicationSchema).optional(),
    disclaimerAcknowledged: zod_1.z.boolean().optional(),
});
exports.NutritionValuesSchema = zod_1.z.object({
    energyKcal: zod_1.z.number().nullable().optional(),
    carbohydratesG: zod_1.z.number().nullable().optional(),
    sugarsG: zod_1.z.number().nullable().optional(),
    addedSugarsG: zod_1.z.number().nullable().optional(),
    proteinG: zod_1.z.number().nullable().optional(),
    fatG: zod_1.z.number().nullable().optional(),
    saturatedFatG: zod_1.z.number().nullable().optional(),
    transFatG: zod_1.z.number().nullable().optional(),
    fibreG: zod_1.z.number().nullable().optional(),
    sodiumMg: zod_1.z.number().nullable().optional(),
    saltG: zod_1.z.number().nullable().optional(),
});
exports.ExtractedLabelNutritionSchema = zod_1.z.object({
    product_name: zod_1.z.string().nullable().optional(),
    brand: zod_1.z.string().nullable().optional(),
    serving_size: zod_1.z.string().nullable().optional(),
    nutrition: zod_1.z.object({
        energy_kcal: zod_1.z.number().nullable().optional(),
        carbohydrates_g: zod_1.z.number().nullable().optional(),
        total_sugars_g: zod_1.z.number().nullable().optional(),
        added_sugars_g: zod_1.z.number().nullable().optional(),
        protein_g: zod_1.z.number().nullable().optional(),
        total_fat_g: zod_1.z.number().nullable().optional(),
        saturated_fat_g: zod_1.z.number().nullable().optional(),
        trans_fat_g: zod_1.z.number().nullable().optional(),
        fiber_g: zod_1.z.number().nullable().optional(),
        sodium_mg: zod_1.z.number().nullable().optional(),
        salt_g: zod_1.z.number().nullable().optional(),
    }),
    ingredients: zod_1.z.array(zod_1.z.string()).default([]),
    allergens: zod_1.z.array(zod_1.z.string()).default([]),
    confidence: zod_1.z.number().min(0).max(1).default(0.8),
});
exports.ProductSchema = zod_1.z.object({
    id: zod_1.z.string(),
    barcode: zod_1.z.string().optional(),
    name: zod_1.z.string(),
    brand: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    servingSize: zod_1.z.string().optional(),
    servingSizeUnit: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().optional(),
    nutritionPer100g: exports.NutritionValuesSchema,
    nutritionPerServing: exports.NutritionValuesSchema.optional(),
    ingredientsText: zod_1.z.string().optional(),
    ingredientsList: zod_1.z.array(zod_1.z.string()),
    detectedAllergens: zod_1.z.array(exports.AllergenRestrictionCodeSchema),
    source: zod_1.z.enum(['internal', 'openfoodfacts', 'ocr_extracted']),
    sourceConfidence: zod_1.z.number(),
});
exports.EvaluateFoodRequestSchema = zod_1.z.object({
    productId: zod_1.z.string().optional(),
    barcode: zod_1.z.string().optional(),
    customNutrition: exports.NutritionValuesSchema.optional(),
    customIngredients: zod_1.z.array(zod_1.z.string()).optional(),
});
