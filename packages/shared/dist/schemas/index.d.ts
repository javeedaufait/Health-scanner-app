import { z } from 'zod';
export declare const HealthConditionCodeSchema: z.ZodEnum<["none", "diabetes", "prediabetes", "hypertension", "high_cholesterol", "weight_management", "heart_health", "kidney_disease", "other"]>;
export declare const DietaryPreferenceCodeSchema: z.ZodEnum<["none", "vegetarian", "vegan", "eggetarian"]>;
export declare const AllergenRestrictionCodeSchema: z.ZodEnum<["milk", "lactose", "peanut", "tree_nuts", "soy", "wheat_gluten", "egg", "fish", "shellfish", "sesame"]>;
export declare const RegisterUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
}, {
    name: string;
    email: string;
    password: string;
}>;
export declare const LoginUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const UserMedicationSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    medicineName: z.ZodString;
    dosage: z.ZodOptional<z.ZodString>;
    frequency: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    medicineName: string;
    id?: string | undefined;
    dosage?: string | undefined;
    frequency?: string | undefined;
}, {
    medicineName: string;
    id?: string | undefined;
    dosage?: string | undefined;
    frequency?: string | undefined;
}>;
export declare const UpdateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    age: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    gender: z.ZodNullable<z.ZodOptional<z.ZodEnum<["male", "female", "other", "prefer_not_to_say"]>>>;
    heightCm: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    weightKg: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    country: z.ZodDefault<z.ZodString>;
    state: z.ZodDefault<z.ZodString>;
    languagePreference: z.ZodDefault<z.ZodEnum<["en", "ml"]>>;
}, "strip", z.ZodTypeAny, {
    country: string;
    state: string;
    languagePreference: "en" | "ml";
    name?: string | undefined;
    age?: number | null | undefined;
    gender?: "other" | "male" | "female" | "prefer_not_to_say" | null | undefined;
    heightCm?: number | null | undefined;
    weightKg?: number | null | undefined;
}, {
    name?: string | undefined;
    age?: number | null | undefined;
    gender?: "other" | "male" | "female" | "prefer_not_to_say" | null | undefined;
    heightCm?: number | null | undefined;
    weightKg?: number | null | undefined;
    country?: string | undefined;
    state?: string | undefined;
    languagePreference?: "en" | "ml" | undefined;
}>;
export declare const UpdateHealthProfileSchema: z.ZodObject<{
    conditions: z.ZodArray<z.ZodEnum<["none", "diabetes", "prediabetes", "hypertension", "high_cholesterol", "weight_management", "heart_health", "kidney_disease", "other"]>, "many">;
    dietaryPreferences: z.ZodArray<z.ZodEnum<["none", "vegetarian", "vegan", "eggetarian"]>, "many">;
    allergenRestrictions: z.ZodArray<z.ZodEnum<["milk", "lactose", "peanut", "tree_nuts", "soy", "wheat_gluten", "egg", "fish", "shellfish", "sesame"]>, "many">;
    customRestrictions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    medications: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        medicineName: z.ZodString;
        dosage: z.ZodOptional<z.ZodString>;
        frequency: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        medicineName: string;
        id?: string | undefined;
        dosage?: string | undefined;
        frequency?: string | undefined;
    }, {
        medicineName: string;
        id?: string | undefined;
        dosage?: string | undefined;
        frequency?: string | undefined;
    }>, "many">>;
    disclaimerAcknowledged: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    conditions: ("none" | "diabetes" | "prediabetes" | "hypertension" | "high_cholesterol" | "weight_management" | "heart_health" | "kidney_disease" | "other")[];
    dietaryPreferences: ("none" | "vegetarian" | "vegan" | "eggetarian")[];
    allergenRestrictions: ("milk" | "lactose" | "peanut" | "tree_nuts" | "soy" | "wheat_gluten" | "egg" | "fish" | "shellfish" | "sesame")[];
    disclaimerAcknowledged?: boolean | undefined;
    customRestrictions?: string[] | undefined;
    medications?: {
        medicineName: string;
        id?: string | undefined;
        dosage?: string | undefined;
        frequency?: string | undefined;
    }[] | undefined;
}, {
    conditions: ("none" | "diabetes" | "prediabetes" | "hypertension" | "high_cholesterol" | "weight_management" | "heart_health" | "kidney_disease" | "other")[];
    dietaryPreferences: ("none" | "vegetarian" | "vegan" | "eggetarian")[];
    allergenRestrictions: ("milk" | "lactose" | "peanut" | "tree_nuts" | "soy" | "wheat_gluten" | "egg" | "fish" | "shellfish" | "sesame")[];
    disclaimerAcknowledged?: boolean | undefined;
    customRestrictions?: string[] | undefined;
    medications?: {
        medicineName: string;
        id?: string | undefined;
        dosage?: string | undefined;
        frequency?: string | undefined;
    }[] | undefined;
}>;
export declare const NutritionValuesSchema: z.ZodObject<{
    energyKcal: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    carbohydratesG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    sugarsG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    addedSugarsG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    proteinG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    fatG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    saturatedFatG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    transFatG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    fibreG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    sodiumMg: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    saltG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    energyKcal?: number | null | undefined;
    carbohydratesG?: number | null | undefined;
    sugarsG?: number | null | undefined;
    addedSugarsG?: number | null | undefined;
    proteinG?: number | null | undefined;
    fatG?: number | null | undefined;
    saturatedFatG?: number | null | undefined;
    transFatG?: number | null | undefined;
    fibreG?: number | null | undefined;
    sodiumMg?: number | null | undefined;
    saltG?: number | null | undefined;
}, {
    energyKcal?: number | null | undefined;
    carbohydratesG?: number | null | undefined;
    sugarsG?: number | null | undefined;
    addedSugarsG?: number | null | undefined;
    proteinG?: number | null | undefined;
    fatG?: number | null | undefined;
    saturatedFatG?: number | null | undefined;
    transFatG?: number | null | undefined;
    fibreG?: number | null | undefined;
    sodiumMg?: number | null | undefined;
    saltG?: number | null | undefined;
}>;
export declare const ExtractedLabelNutritionSchema: z.ZodObject<{
    is_edible_food: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    product_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    brand: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    serving_size: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nutrition: z.ZodObject<{
        energy_kcal: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        carbohydrates_g: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        total_sugars_g: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        added_sugars_g: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        protein_g: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        total_fat_g: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        saturated_fat_g: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        trans_fat_g: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fiber_g: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        sodium_mg: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        salt_g: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        energy_kcal?: number | null | undefined;
        carbohydrates_g?: number | null | undefined;
        total_sugars_g?: number | null | undefined;
        added_sugars_g?: number | null | undefined;
        protein_g?: number | null | undefined;
        total_fat_g?: number | null | undefined;
        saturated_fat_g?: number | null | undefined;
        trans_fat_g?: number | null | undefined;
        fiber_g?: number | null | undefined;
        sodium_mg?: number | null | undefined;
        salt_g?: number | null | undefined;
    }, {
        energy_kcal?: number | null | undefined;
        carbohydrates_g?: number | null | undefined;
        total_sugars_g?: number | null | undefined;
        added_sugars_g?: number | null | undefined;
        protein_g?: number | null | undefined;
        total_fat_g?: number | null | undefined;
        saturated_fat_g?: number | null | undefined;
        trans_fat_g?: number | null | undefined;
        fiber_g?: number | null | undefined;
        sodium_mg?: number | null | undefined;
        salt_g?: number | null | undefined;
    }>;
    ingredients: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    allergens: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    confidence: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    is_edible_food: boolean;
    nutrition: {
        energy_kcal?: number | null | undefined;
        carbohydrates_g?: number | null | undefined;
        total_sugars_g?: number | null | undefined;
        added_sugars_g?: number | null | undefined;
        protein_g?: number | null | undefined;
        total_fat_g?: number | null | undefined;
        saturated_fat_g?: number | null | undefined;
        trans_fat_g?: number | null | undefined;
        fiber_g?: number | null | undefined;
        sodium_mg?: number | null | undefined;
        salt_g?: number | null | undefined;
    };
    ingredients: string[];
    allergens: string[];
    confidence: number;
    product_name?: string | null | undefined;
    brand?: string | null | undefined;
    serving_size?: string | null | undefined;
}, {
    nutrition: {
        energy_kcal?: number | null | undefined;
        carbohydrates_g?: number | null | undefined;
        total_sugars_g?: number | null | undefined;
        added_sugars_g?: number | null | undefined;
        protein_g?: number | null | undefined;
        total_fat_g?: number | null | undefined;
        saturated_fat_g?: number | null | undefined;
        trans_fat_g?: number | null | undefined;
        fiber_g?: number | null | undefined;
        sodium_mg?: number | null | undefined;
        salt_g?: number | null | undefined;
    };
    is_edible_food?: boolean | undefined;
    product_name?: string | null | undefined;
    brand?: string | null | undefined;
    serving_size?: string | null | undefined;
    ingredients?: string[] | undefined;
    allergens?: string[] | undefined;
    confidence?: number | undefined;
}>;
export declare const ProductSchema: z.ZodObject<{
    id: z.ZodString;
    barcode: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    brand: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    servingSize: z.ZodOptional<z.ZodString>;
    servingSizeUnit: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    nutritionPer100g: z.ZodObject<{
        energyKcal: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        carbohydratesG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        sugarsG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        addedSugarsG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        proteinG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fatG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        saturatedFatG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        transFatG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fibreG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        sodiumMg: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        saltG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        energyKcal?: number | null | undefined;
        carbohydratesG?: number | null | undefined;
        sugarsG?: number | null | undefined;
        addedSugarsG?: number | null | undefined;
        proteinG?: number | null | undefined;
        fatG?: number | null | undefined;
        saturatedFatG?: number | null | undefined;
        transFatG?: number | null | undefined;
        fibreG?: number | null | undefined;
        sodiumMg?: number | null | undefined;
        saltG?: number | null | undefined;
    }, {
        energyKcal?: number | null | undefined;
        carbohydratesG?: number | null | undefined;
        sugarsG?: number | null | undefined;
        addedSugarsG?: number | null | undefined;
        proteinG?: number | null | undefined;
        fatG?: number | null | undefined;
        saturatedFatG?: number | null | undefined;
        transFatG?: number | null | undefined;
        fibreG?: number | null | undefined;
        sodiumMg?: number | null | undefined;
        saltG?: number | null | undefined;
    }>;
    nutritionPerServing: z.ZodOptional<z.ZodObject<{
        energyKcal: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        carbohydratesG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        sugarsG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        addedSugarsG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        proteinG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fatG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        saturatedFatG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        transFatG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fibreG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        sodiumMg: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        saltG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        energyKcal?: number | null | undefined;
        carbohydratesG?: number | null | undefined;
        sugarsG?: number | null | undefined;
        addedSugarsG?: number | null | undefined;
        proteinG?: number | null | undefined;
        fatG?: number | null | undefined;
        saturatedFatG?: number | null | undefined;
        transFatG?: number | null | undefined;
        fibreG?: number | null | undefined;
        sodiumMg?: number | null | undefined;
        saltG?: number | null | undefined;
    }, {
        energyKcal?: number | null | undefined;
        carbohydratesG?: number | null | undefined;
        sugarsG?: number | null | undefined;
        addedSugarsG?: number | null | undefined;
        proteinG?: number | null | undefined;
        fatG?: number | null | undefined;
        saturatedFatG?: number | null | undefined;
        transFatG?: number | null | undefined;
        fibreG?: number | null | undefined;
        sodiumMg?: number | null | undefined;
        saltG?: number | null | undefined;
    }>>;
    ingredientsText: z.ZodOptional<z.ZodString>;
    ingredientsList: z.ZodArray<z.ZodString, "many">;
    detectedAllergens: z.ZodArray<z.ZodEnum<["milk", "lactose", "peanut", "tree_nuts", "soy", "wheat_gluten", "egg", "fish", "shellfish", "sesame"]>, "many">;
    source: z.ZodEnum<["internal", "openfoodfacts", "ocr_extracted"]>;
    sourceConfidence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    ingredientsList: string[];
    detectedAllergens: ("milk" | "lactose" | "peanut" | "tree_nuts" | "soy" | "wheat_gluten" | "egg" | "fish" | "shellfish" | "sesame")[];
    id: string;
    name: string;
    nutritionPer100g: {
        energyKcal?: number | null | undefined;
        carbohydratesG?: number | null | undefined;
        sugarsG?: number | null | undefined;
        addedSugarsG?: number | null | undefined;
        proteinG?: number | null | undefined;
        fatG?: number | null | undefined;
        saturatedFatG?: number | null | undefined;
        transFatG?: number | null | undefined;
        fibreG?: number | null | undefined;
        sodiumMg?: number | null | undefined;
        saltG?: number | null | undefined;
    };
    source: "internal" | "openfoodfacts" | "ocr_extracted";
    sourceConfidence: number;
    barcode?: string | undefined;
    ingredientsText?: string | undefined;
    brand?: string | undefined;
    category?: string | undefined;
    servingSize?: string | undefined;
    servingSizeUnit?: string | undefined;
    imageUrl?: string | undefined;
    nutritionPerServing?: {
        energyKcal?: number | null | undefined;
        carbohydratesG?: number | null | undefined;
        sugarsG?: number | null | undefined;
        addedSugarsG?: number | null | undefined;
        proteinG?: number | null | undefined;
        fatG?: number | null | undefined;
        saturatedFatG?: number | null | undefined;
        transFatG?: number | null | undefined;
        fibreG?: number | null | undefined;
        sodiumMg?: number | null | undefined;
        saltG?: number | null | undefined;
    } | undefined;
}, {
    ingredientsList: string[];
    detectedAllergens: ("milk" | "lactose" | "peanut" | "tree_nuts" | "soy" | "wheat_gluten" | "egg" | "fish" | "shellfish" | "sesame")[];
    id: string;
    name: string;
    nutritionPer100g: {
        energyKcal?: number | null | undefined;
        carbohydratesG?: number | null | undefined;
        sugarsG?: number | null | undefined;
        addedSugarsG?: number | null | undefined;
        proteinG?: number | null | undefined;
        fatG?: number | null | undefined;
        saturatedFatG?: number | null | undefined;
        transFatG?: number | null | undefined;
        fibreG?: number | null | undefined;
        sodiumMg?: number | null | undefined;
        saltG?: number | null | undefined;
    };
    source: "internal" | "openfoodfacts" | "ocr_extracted";
    sourceConfidence: number;
    barcode?: string | undefined;
    ingredientsText?: string | undefined;
    brand?: string | undefined;
    category?: string | undefined;
    servingSize?: string | undefined;
    servingSizeUnit?: string | undefined;
    imageUrl?: string | undefined;
    nutritionPerServing?: {
        energyKcal?: number | null | undefined;
        carbohydratesG?: number | null | undefined;
        sugarsG?: number | null | undefined;
        addedSugarsG?: number | null | undefined;
        proteinG?: number | null | undefined;
        fatG?: number | null | undefined;
        saturatedFatG?: number | null | undefined;
        transFatG?: number | null | undefined;
        fibreG?: number | null | undefined;
        sodiumMg?: number | null | undefined;
        saltG?: number | null | undefined;
    } | undefined;
}>;
export declare const EvaluateFoodRequestSchema: z.ZodObject<{
    productId: z.ZodOptional<z.ZodString>;
    barcode: z.ZodOptional<z.ZodString>;
    customNutrition: z.ZodOptional<z.ZodObject<{
        energyKcal: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        carbohydratesG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        sugarsG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        addedSugarsG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        proteinG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fatG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        saturatedFatG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        transFatG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        fibreG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        sodiumMg: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        saltG: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        energyKcal?: number | null | undefined;
        carbohydratesG?: number | null | undefined;
        sugarsG?: number | null | undefined;
        addedSugarsG?: number | null | undefined;
        proteinG?: number | null | undefined;
        fatG?: number | null | undefined;
        saturatedFatG?: number | null | undefined;
        transFatG?: number | null | undefined;
        fibreG?: number | null | undefined;
        sodiumMg?: number | null | undefined;
        saltG?: number | null | undefined;
    }, {
        energyKcal?: number | null | undefined;
        carbohydratesG?: number | null | undefined;
        sugarsG?: number | null | undefined;
        addedSugarsG?: number | null | undefined;
        proteinG?: number | null | undefined;
        fatG?: number | null | undefined;
        saturatedFatG?: number | null | undefined;
        transFatG?: number | null | undefined;
        fibreG?: number | null | undefined;
        sodiumMg?: number | null | undefined;
        saltG?: number | null | undefined;
    }>>;
    customIngredients: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    barcode?: string | undefined;
    productId?: string | undefined;
    customNutrition?: {
        energyKcal?: number | null | undefined;
        carbohydratesG?: number | null | undefined;
        sugarsG?: number | null | undefined;
        addedSugarsG?: number | null | undefined;
        proteinG?: number | null | undefined;
        fatG?: number | null | undefined;
        saturatedFatG?: number | null | undefined;
        transFatG?: number | null | undefined;
        fibreG?: number | null | undefined;
        sodiumMg?: number | null | undefined;
        saltG?: number | null | undefined;
    } | undefined;
    customIngredients?: string[] | undefined;
}, {
    barcode?: string | undefined;
    productId?: string | undefined;
    customNutrition?: {
        energyKcal?: number | null | undefined;
        carbohydratesG?: number | null | undefined;
        sugarsG?: number | null | undefined;
        addedSugarsG?: number | null | undefined;
        proteinG?: number | null | undefined;
        fatG?: number | null | undefined;
        saturatedFatG?: number | null | undefined;
        transFatG?: number | null | undefined;
        fibreG?: number | null | undefined;
        sodiumMg?: number | null | undefined;
        saltG?: number | null | undefined;
    } | undefined;
    customIngredients?: string[] | undefined;
}>;
//# sourceMappingURL=index.d.ts.map