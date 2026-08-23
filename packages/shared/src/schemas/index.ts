import { z } from 'zod';

export const HealthConditionCodeSchema = z.enum([
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

export const DietaryPreferenceCodeSchema = z.enum([
  'none',
  'vegetarian',
  'vegan',
  'eggetarian',
]);

export const AllergenRestrictionCodeSchema = z.enum([
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

export const RegisterUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const LoginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const UserMedicationSchema = z.object({
  id: z.string().optional(),
  medicineName: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  age: z.number().int().min(1).max(125).optional().nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().nullable(),
  heightCm: z.number().positive().optional().nullable(),
  weightKg: z.number().positive().optional().nullable(),
  country: z.string().default('India'),
  state: z.string().default('Kerala'),
  languagePreference: z.enum(['en', 'ml']).default('en'),
});

export const UpdateHealthProfileSchema = z.object({
  conditions: z.array(HealthConditionCodeSchema),
  dietaryPreferences: z.array(DietaryPreferenceCodeSchema),
  allergenRestrictions: z.array(AllergenRestrictionCodeSchema),
  customRestrictions: z.array(z.string().max(100)).optional(),
  medications: z.array(UserMedicationSchema).optional(),
  disclaimerAcknowledged: z.boolean().optional(),
});

export const NutritionValuesSchema = z.object({
  energyKcal: z.number().nullable().optional(),
  carbohydratesG: z.number().nullable().optional(),
  sugarsG: z.number().nullable().optional(),
  addedSugarsG: z.number().nullable().optional(),
  proteinG: z.number().nullable().optional(),
  fatG: z.number().nullable().optional(),
  saturatedFatG: z.number().nullable().optional(),
  transFatG: z.number().nullable().optional(),
  fibreG: z.number().nullable().optional(),
  sodiumMg: z.number().nullable().optional(),
  saltG: z.number().nullable().optional(),
});

export const ExtractedLabelNutritionSchema = z.object({
  product_name: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  serving_size: z.string().nullable().optional(),
  nutrition: z.object({
    energy_kcal: z.number().nullable().optional(),
    carbohydrates_g: z.number().nullable().optional(),
    total_sugars_g: z.number().nullable().optional(),
    added_sugars_g: z.number().nullable().optional(),
    protein_g: z.number().nullable().optional(),
    total_fat_g: z.number().nullable().optional(),
    saturated_fat_g: z.number().nullable().optional(),
    trans_fat_g: z.number().nullable().optional(),
    fiber_g: z.number().nullable().optional(),
    sodium_mg: z.number().nullable().optional(),
    salt_g: z.number().nullable().optional(),
  }),
  ingredients: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.8),
});

export const ProductSchema = z.object({
  id: z.string(),
  barcode: z.string().optional(),
  name: z.string(),
  brand: z.string().optional(),
  category: z.string().optional(),
  servingSize: z.string().optional(),
  servingSizeUnit: z.string().optional(),
  imageUrl: z.string().optional(),
  nutritionPer100g: NutritionValuesSchema,
  nutritionPerServing: NutritionValuesSchema.optional(),
  ingredientsText: z.string().optional(),
  ingredientsList: z.array(z.string()),
  detectedAllergens: z.array(AllergenRestrictionCodeSchema),
  source: z.enum(['internal', 'openfoodfacts', 'ocr_extracted']),
  sourceConfidence: z.number(),
});

export const EvaluateFoodRequestSchema = z.object({
  productId: z.string().optional(),
  barcode: z.string().optional(),
  customNutrition: NutritionValuesSchema.optional(),
  customIngredients: z.array(z.string()).optional(),
});
