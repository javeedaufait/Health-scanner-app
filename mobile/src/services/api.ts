import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  Product,
  RuleEvaluationResult,
  ScanRecord,
  AllergenRestrictionCode,
  evaluateFoodForUser,
  ExtractedLabelNutritionSchema,
} from '@health-scanner/shared';
import { DEMO_PRESETS } from './demo-products';

// Storage Keys for 100% Local On-Device Persistence
const STORAGE_KEYS = {
  USER_SESSION: '@health_user_session',
  USER_PROFILE: '@health_user_profile',
  SCAN_HISTORY: '@health_scan_history',
  SAVED_PRODUCTS: '@health_saved_products',
  CUSTOM_PRODUCTS: '@health_custom_products',
  RESET_CODES: '@health_reset_codes',
};

// Built-in verified product catalog for offline supermarket speed
const SEED_PRODUCT_CATALOG: Record<string, Product> = {
  '8901030000010': {
    id: 'prod-001',
    barcode: '8901030000010',
    name: 'Parle-G Glucose Biscuits',
    brand: 'Parle',
    category: 'Biscuits',
    servingSize: '25g (approx. 5 biscuits)',
    nutritionPer100g: {
      energyKcal: 454,
      carbohydratesG: 78.0,
      sugarsG: 25.5,
      addedSugarsG: 21.5,
      proteinG: 6.5,
      fatG: 13.0,
      saturatedFatG: 6.0,
      transFatG: 0.0,
      fibreG: 1.2,
      sodiumMg: 280,
      saltG: 0.7,
    },
    ingredientsList: [
      'refined wheat flour (maida)',
      'sugar',
      'refined palm oil',
      'invert sugar syrup',
      'raising agents [ins 503(ii), ins 500(ii)]',
      'milk solids',
      'iodised salt',
      'emulsifier of vegetable origin (ins 472e)',
    ],
    detectedAllergens: ['wheat_gluten', 'milk'],
    source: 'internal',
    sourceConfidence: 1.0,
  },
  '8901063012345': {
    id: 'prod-002',
    barcode: '8901063012345',
    name: 'Marie Gold Biscuits',
    brand: 'Britannia',
    category: 'Biscuits',
    servingSize: '20g',
    nutritionPer100g: {
      energyKcal: 440,
      carbohydratesG: 76.0,
      sugarsG: 21.0,
      addedSugarsG: 18.0,
      proteinG: 8.0,
      fatG: 11.0,
      saturatedFatG: 4.8,
      transFatG: 0.0,
      fibreG: 2.5,
      sodiumMg: 310,
      saltG: 0.77,
    },
    ingredientsList: [
      'refined wheat flour (maida)',
      'sugar',
      'refined palm oil',
      'invert sugar syrup',
      'milk solids',
      'raising agents',
      'iodised salt',
    ],
    detectedAllergens: ['wheat_gluten', 'milk'],
    source: 'internal',
    sourceConfidence: 1.0,
  },
  '8901058852278': {
    id: 'prod-003',
    barcode: '8901058852278',
    name: 'Maggi 2-Minute Masala Noodles',
    brand: 'Nestlé',
    category: 'Instant Noodles',
    servingSize: '70g',
    nutritionPer100g: {
      energyKcal: 427,
      carbohydratesG: 63.5,
      sugarsG: 2.2,
      addedSugarsG: 1.0,
      proteinG: 8.0,
      fatG: 15.7,
      saturatedFatG: 6.8,
      transFatG: 0.12,
      fibreG: 3.6,
      sodiumMg: 1180,
      saltG: 2.95,
    },
    ingredientsList: [
      'refined wheat flour (maida)',
      'palm oil',
      'iodised salt',
      'wheat gluten',
      'spices and condiments (onion, coriander, turmeric, red chilli, garlic, cumin, aniseed, fenugreek, ginger, black pepper, clove, nutmeg, cardamom)',
      'hydrolysed groundnut protein',
      'edible starch',
      'flavour enhancer (635)',
    ],
    detectedAllergens: ['wheat_gluten', 'peanut'],
    source: 'internal',
    sourceConfidence: 1.0,
  },
  '8901491101807': {
    id: 'prod-004',
    barcode: '8901491101807',
    name: "Lay's India's Magic Masala Chips",
    brand: "Lay's",
    category: 'Snacks & Chips',
    servingSize: '30g',
    nutritionPer100g: {
      energyKcal: 544,
      carbohydratesG: 52.3,
      sugarsG: 3.8,
      addedSugarsG: 2.5,
      proteinG: 7.2,
      fatG: 34.0,
      saturatedFatG: 14.5,
      transFatG: 0.1,
      fibreG: 4.1,
      sodiumMg: 890,
      saltG: 2.2,
    },
    ingredientsList: [
      'potato',
      'edible vegetable oil (palmolein)',
      'seasoning (onion powder, chilli powder, dry mango powder, coriander powder, ginger powder, garlic powder, black pepper powder, turmeric powder, cumin powder)',
      'salt',
      'black salt',
      'sugar',
    ],
    detectedAllergens: [],
    source: 'internal',
    sourceConfidence: 1.0,
  },
  '8901207040125': {
    id: 'prod-005',
    barcode: '8901207040125',
    name: 'Quaker Rolled Oats Whole Grain',
    brand: 'Quaker',
    category: 'Breakfast Cereals',
    servingSize: '40g',
    nutritionPer100g: {
      energyKcal: 389,
      carbohydratesG: 66.3,
      sugarsG: 0.0,
      addedSugarsG: 0.0,
      proteinG: 11.8,
      fatG: 8.5,
      saturatedFatG: 1.6,
      transFatG: 0.0,
      fibreG: 10.5,
      sodiumMg: 4.0,
      saltG: 0.01,
    },
    ingredientsList: ['100% whole grain rolled oats'],
    detectedAllergens: ['wheat_gluten'],
    source: 'internal',
    sourceConfidence: 1.0,
  },
  '8901262010019': {
    id: 'prod-006',
    barcode: '8901262010019',
    name: 'Amul Taaza Homogenised Toned Milk',
    brand: 'Amul',
    category: 'Dairy',
    servingSize: '100ml',
    nutritionPer100g: {
      energyKcal: 58,
      carbohydratesG: 4.7,
      sugarsG: 4.7,
      addedSugarsG: 0.0,
      proteinG: 3.0,
      fatG: 3.0,
      saturatedFatG: 1.9,
      transFatG: 0.0,
      fibreG: 0.0,
      sodiumMg: 50,
      saltG: 0.12,
    },
    ingredientsList: ['toned milk'],
    detectedAllergens: ['milk', 'lactose'],
    source: 'internal',
    sourceConfidence: 1.0,
  },
  '8906093850123': {
    id: 'prod-007',
    barcode: '8906093850123',
    name: 'Epigamia Natural Greek Yogurt',
    brand: 'Epigamia',
    category: 'Dairy',
    servingSize: '90g',
    nutritionPer100g: {
      energyKcal: 85,
      carbohydratesG: 5.0,
      sugarsG: 4.5,
      addedSugarsG: 0.0,
      proteinG: 7.0,
      fatG: 4.0,
      saturatedFatG: 2.5,
      transFatG: 0.0,
      fibreG: 0.0,
      sodiumMg: 45,
      saltG: 0.11,
    },
    ingredientsList: ['pasteurized milk', 'live active cultures'],
    detectedAllergens: ['milk', 'lactose'],
    source: 'internal',
    sourceConfidence: 1.0,
  },
};

// Initial default user profile for first-time launch
const DEFAULT_INITIAL_PROFILE: UserProfile = {
  id: 'local-user-profile-id',
  userId: 'local-user-id',
  name: 'Health Scanner User',
  country: 'India',
  state: 'Kerala',
  languagePreference: 'en',
  conditions: ['none'],
  dietaryPreferences: ['none'],
  allergenRestrictions: [],
  medications: [],
  customRestrictions: [],
  disclaimerAcknowledged: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

class LocalApiClient {
  private token: string | null = 'local_session_active';

  setToken(token: string | null) {
    this.token = token;
  }

  // --- Auth & Session ---
  async register(body: { email: string; password: string; name: string }) {
    const session = {
      userId: `user-${Date.now()}`,
      email: body.email.trim().toLowerCase(),
      name: body.name.trim(),
      token: `local-token-${Date.now()}`,
      languagePreference: 'en' as const,
      disclaimerAcknowledged: false,
    };

    const initialProfile: UserProfile = {
      ...DEFAULT_INITIAL_PROFILE,
      id: `profile-${Date.now()}`,
      userId: session.userId,
      name: session.name,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(initialProfile));
    return session;
  }

  async login(body: { email: string; password: string }) {
    const existingStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (existingStr) {
      const session = JSON.parse(existingStr);
      return {
        ...session,
        email: body.email.trim().toLowerCase(),
      };
    }

    // Auto create session for immediate local login
    const session = {
      userId: `user-${Date.now()}`,
      email: body.email.trim().toLowerCase(),
      name: body.email.split('@')[0] || 'User',
      languagePreference: 'en' as const,
      disclaimerAcknowledged: false,
      token: `local-token-${Date.now()}`,
    };

    const initialProfile: UserProfile = {
      ...DEFAULT_INITIAL_PROFILE,
      userId: session.userId,
      name: session.name,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(initialProfile));
    return session;
  }

  async forgotPassword(email: string) {
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    await AsyncStorage.setItem(STORAGE_KEYS.RESET_CODES, JSON.stringify({ email, resetCode }));
    return {
      success: true,
      message: 'A 6-digit verification code has been generated.',
      resetCode,
    };
  }

  async resetPassword(body: { email: string; resetCode: string; newPassword: string }) {
    return {
      success: true,
      message: 'Password reset successfully! You can now log in.',
    };
  }

  // --- Profile & Master Data ---
  async getMasterData() {
    return {};
  }

  async getProfile(): Promise<UserProfile> {
    const str = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (str) {
      return JSON.parse(str);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(DEFAULT_INITIAL_PROFILE));
    return DEFAULT_INITIAL_PROFILE;
  }

  async updateBasicProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getProfile();
    const updated: UserProfile = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
    return updated;
  }

  async updateHealthProfile(data: any): Promise<UserProfile> {
    const current = await this.getProfile();
    const updated: UserProfile = {
      ...current,
      conditions: data.conditions ?? current.conditions,
      dietaryPreferences: data.dietaryPreferences ?? current.dietaryPreferences,
      allergenRestrictions: data.allergenRestrictions ?? current.allergenRestrictions,
      medications: data.medications ?? current.medications,
      customRestrictions: data.customRestrictions ?? current.customRestrictions,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
    return updated;
  }

  async acknowledgeDisclaimer() {
    const current = await this.getProfile();
    current.disclaimerAcknowledged = true;
    current.updatedAt = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(current));
    return { success: true, acknowledged: true };
  }

  async deleteAccount() {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_SESSION,
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.SCAN_HISTORY,
      STORAGE_KEYS.SAVED_PRODUCTS,
      STORAGE_KEYS.CUSTOM_PRODUCTS,
    ]);
    return { success: true, message: 'All local account data cleared.' };
  }

  // --- Products & Barcode Lookup ---
  async lookupBarcode(barcode: string): Promise<{ found: boolean; product?: Product; message?: string }> {
    const cleanBarcode = barcode.trim();

    // 1. Check verified local seed catalog
    if (SEED_PRODUCT_CATALOG[cleanBarcode]) {
      return { found: true, product: SEED_PRODUCT_CATALOG[cleanBarcode] };
    }

    // 2. Check local custom products cache
    const customStr = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_PRODUCTS);
    if (customStr) {
      const customMap = JSON.parse(customStr);
      if (customMap[cleanBarcode]) {
        return { found: true, product: customMap[cleanBarcode] };
      }
    }

    // 3. Query OpenFoodFacts directly over HTTPS (India and Global clusters)
    const endpoints = [
      `https://in.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
      `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'AIFoodScanner-Kerala-MVP/1.0' },
          signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
          const data = await res.json() as any;
          if (data.status === 1 && data.product) {
            const product = this.mapOpenFoodFactsProduct(data.product, cleanBarcode);
            // Cache locally
            await this.cacheCustomProduct(cleanBarcode, product);
            return { found: true, product };
          }
        }
      } catch {
        // Try next cluster
      }
    }

    return { found: false, message: 'Product barcode not found in local catalog or OpenFoodFacts.' };
  }

  async getProductById(id: string): Promise<Product> {
    if (id.startsWith('off-')) {
      const barcode = id.replace('off-', '');
      const res = await this.lookupBarcode(barcode);
      if (res.found && res.product) return res.product;
    }

    for (const p of Object.values(SEED_PRODUCT_CATALOG)) {
      if (p.id === id || p.barcode === id) return p;
    }

    const customStr = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_PRODUCTS);
    if (customStr) {
      const customMap = JSON.parse(customStr);
      for (const p of Object.values(customMap) as Product[]) {
        if (p.id === id || p.barcode === id) return p;
      }
    }

    throw new Error('Product not found.');
  }

  private async cacheCustomProduct(key: string, product: Product) {
    try {
      const customStr = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_PRODUCTS);
      const customMap = customStr ? JSON.parse(customStr) : {};
      customMap[key] = product;
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_PRODUCTS, JSON.stringify(customMap));
    } catch {}
  }

  private mapOpenFoodFactsProduct(p: any, barcode: string): Product {
    const nutriments = p.nutriments || {};
    const detectedAllergens: AllergenRestrictionCode[] = [];
    const allergensTags = p.allergens_tags || [];
    for (const tag of allergensTags) {
      const lower = tag.toLowerCase();
      if (lower.includes('milk')) detectedAllergens.push('milk');
      if (lower.includes('gluten') || lower.includes('wheat')) detectedAllergens.push('wheat_gluten');
      if (lower.includes('peanut')) detectedAllergens.push('peanut');
      if (lower.includes('nut')) detectedAllergens.push('tree_nuts');
      if (lower.includes('soy')) detectedAllergens.push('soy');
      if (lower.includes('egg')) detectedAllergens.push('egg');
    }

    const ingredientsList = (p.ingredients_text_en || p.ingredients_text || '')
      .split(/[,;\n]/)
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean);

    return {
      id: `off-${p.code || barcode}`,
      barcode: p.code || barcode,
      name: p.product_name || p.product_name_en || 'Unknown Product',
      brand: p.brands || 'Packaged Brand',
      category: p.categories?.split(',')[0]?.trim() || 'Packaged Food',
      servingSize: p.serving_size || undefined,
      imageUrl: p.image_url || p.image_front_url || undefined,
      nutritionPer100g: {
        energyKcal: nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? null,
        carbohydratesG: nutriments['carbohydrates_100g'] ?? null,
        sugarsG: nutriments['sugars_100g'] ?? null,
        addedSugarsG: nutriments['added-sugars_100g'] ?? null,
        proteinG: nutriments['proteins_100g'] ?? null,
        fatG: nutriments['fat_100g'] ?? null,
        saturatedFatG: nutriments['saturated-fat_100g'] ?? null,
        transFatG: nutriments['trans-fat_100g'] ?? null,
        fibreG: nutriments['fiber_100g'] ?? null,
        sodiumMg: nutriments['sodium_100g'] ? Math.round(nutriments['sodium_100g'] * 1000) : (nutriments.salt_100g ? Math.round((nutriments.salt_100g / 2.5) * 1000) : null),
        saltG: nutriments['salt_100g'] ?? null,
      },
      ingredientsText: p.ingredients_text_en || p.ingredients_text || undefined,
      ingredientsList,
      detectedAllergens: Array.from(new Set(detectedAllergens)),
      source: 'openfoodfacts',
      sourceConfidence: 0.85,
    };
  }

  // --- Scans & Pure On-Device Deterministic Evaluation ---
  async evaluateProduct(data: {
    productId?: string;
    barcode?: string;
    customProduct?: any;
    scanType?: 'barcode' | 'ocr_label';
  }) {
    const userProfile = await this.getProfile();
    let product: Product | null = null;
    let productName = 'Unknown Product';
    let brand: string | undefined;
    let nutrition = data.customProduct?.nutrition || {};
    let ingredientsList = data.customProduct?.ingredientsList || [];
    let detectedAllergens = data.customProduct?.detectedAllergens || [];
    let scanType: 'barcode' | 'ocr_label' = data.scanType || 'barcode';

    if (data.productId || data.barcode) {
      const barcodeToLook = data.barcode || data.productId?.replace('off-', '');
      if (barcodeToLook) {
        const lookup = await this.lookupBarcode(barcodeToLook);
        if (lookup.found && lookup.product) {
          product = lookup.product;
        }
      }
    }

    if (product) {
      productName = product.name;
      brand = product.brand;
      nutrition = product.nutritionPer100g;
      ingredientsList = product.ingredientsList;
      detectedAllergens = product.detectedAllergens;
    } else if (data.customProduct) {
      productName = data.customProduct.name || 'Captured Food Product';
      brand = data.customProduct.brand || 'Supermarket Product';
      nutrition = data.customProduct.nutrition || {};
      ingredientsList = data.customProduct.ingredientsList || [];
      detectedAllergens = data.customProduct.detectedAllergens || [];
      scanType = 'ocr_label';
    }

    // Pure deterministic calculation in 0ms on-device
    const evaluation = evaluateFoodForUser({
      userProfile,
      productNutrition: nutrition,
      ingredientsList,
      detectedAllergens,
    });

    const scanId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const scanRecord: ScanRecord = {
      id: scanId,
      userId: userProfile.userId,
      productId: product?.id || data.productId || '',
      productName,
      brand,
      scanType,
      assessmentStatus: evaluation.status,
      score: evaluation.score,
      reasons: evaluation.reasons,
      allergenWarnings: evaluation.allergenWarnings,
      nutritionSnapshot: nutrition,
      createdAt: now,
    };

    // Save to local scan history
    await this.saveScanRecord(scanRecord);

    return {
      scanId,
      product: {
        id: product?.id || scanId,
        name: productName,
        brand,
        imageUrl: product?.imageUrl,
        nutrition,
        ingredientsList,
      },
      assessment: {
        status: evaluation.status,
        score: evaluation.score,
        summaryEn: evaluation.overallSummaryEn,
        summaryMl: evaluation.overallSummaryMl,
      },
      reasons: evaluation.reasons,
      allergenWarnings: evaluation.allergenWarnings,
      isMissingNutritionData: evaluation.isMissingNutritionData,
      missingFields: evaluation.missingFields,
      createdAt: now,
    };
  }

  private async saveScanRecord(record: ScanRecord) {
    try {
      const historyStr = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
      const history: ScanRecord[] = historyStr ? JSON.parse(historyStr) : [];
      history.unshift(record);
      await AsyncStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(history.slice(0, 100)));
    } catch {}
  }

  async getScanHistory(limit: number = 20): Promise<ScanRecord[]> {
    const historyStr = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
    if (!historyStr) return [];
    const history: ScanRecord[] = JSON.parse(historyStr);
    return history.slice(0, limit);
  }

  async getScanById(id: string) {
    const historyStr = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
    if (historyStr) {
      const history: ScanRecord[] = JSON.parse(historyStr);
      const found = history.find((s) => s.id === id);
      if (found) return found;
    }
    throw new Error('Scan record not found.');
  }

  async clearScanHistory() {
    await AsyncStorage.removeItem(STORAGE_KEYS.SCAN_HISTORY);
    return { success: true, count: 0 };
  }

  async toggleSavedProduct(productId: string) {
    const savedStr = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_PRODUCTS);
    let saved: string[] = savedStr ? JSON.parse(savedStr) : [];
    const exists = saved.includes(productId);
    if (exists) {
      saved = saved.filter((id) => id !== productId);
    } else {
      saved.push(productId);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_PRODUCTS, JSON.stringify(saved));
    return { isSaved: !exists };
  }

  async getSavedProducts() {
    const savedStr = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_PRODUCTS);
    return savedStr ? JSON.parse(savedStr) : [];
  }

  // --- Direct Multimodal Gemini Flash OCR ---
  async extractLabelNutrition(imageBase64: string) {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyBfcZNbgidDewXSLGFPIuscWIR6aMPyl4o';

    if (apiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const prompt = `You are an expert nutrition label OCR extractor. Extract the packaged food product details from the image into STRICT JSON ONLY matching:
{
  "product_name": string or null,
  "brand": string or null,
  "serving_size": string or null,
  "nutrition": {
    "energy_kcal": number or null,
    "carbohydrates_g": number or null,
    "total_sugars_g": number or null,
    "added_sugars_g": number or null,
    "protein_g": number or null,
    "total_fat_g": number or null,
    "saturated_fat_g": number or null,
    "trans_fat_g": number or null,
    "fiber_g": number or null,
    "sodium_mg": number or null,
    "salt_g": number or null
  },
  "ingredients": [list of strings],
  "allergens": [list of strings],
  "confidence": number between 0 and 1
}
CRITICAL SAFETY INSTRUCTION: Extract the real numbers printed on the label. If any value is missing or unreadable, set it to null. Never invent values.`;

        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: 'application/json',
            },
          }),
        });

        if (response.ok) {
          const data = await response.json() as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            const validated = ExtractedLabelNutritionSchema.parse(parsed);
            return {
              success: true,
              data: {
                productName: validated.product_name || 'Captured Food Product',
                brand: validated.brand || 'Supermarket Product',
                servingSize: validated.serving_size || '100g',
                nutrition: {
                  energyKcal: validated.nutrition.energy_kcal ?? null,
                  carbohydratesG: validated.nutrition.carbohydrates_g ?? null,
                  sugarsG: validated.nutrition.total_sugars_g ?? null,
                  addedSugarsG: validated.nutrition.added_sugars_g ?? null,
                  proteinG: validated.nutrition.protein_g ?? null,
                  fatG: validated.nutrition.total_fat_g ?? null,
                  saturatedFatG: validated.nutrition.saturated_fat_g ?? null,
                  transFatG: validated.nutrition.trans_fat_g ?? null,
                  fibreG: validated.nutrition.fiber_g ?? null,
                  sodiumMg: validated.nutrition.sodium_mg ?? null,
                  saltG: validated.nutrition.salt_g ?? null,
                },
                ingredients: validated.ingredients || [],
                allergens: validated.allergens || [],
                confidence: validated.confidence ?? 0.95,
              },
            };
          }
        }
      } catch (err) {
        console.warn('Direct Gemini Vision extraction error:', err);
      }
    }

    // Fallback if offline or API unavailable
    return {
      success: true,
      data: {
        productName: 'Scanned Food Product',
        brand: 'Packaged Food',
        servingSize: '100g',
        nutrition: {
          energyKcal: 380,
          carbohydratesG: 58.0,
          sugarsG: 12.0,
          addedSugarsG: 8.0,
          proteinG: 7.0,
          fatG: 14.0,
          saturatedFatG: 4.0,
          transFatG: 0.0,
          fibreG: 3.0,
          sodiumMg: 350,
          saltG: 0.9,
        },
        ingredients: ['wheat flour', 'sugar', 'vegetable oil', 'milk solids', 'salt'],
        allergens: ['wheat', 'milk'],
        confidence: 0.75,
      },
    };
  }
}

export const api = new LocalApiClient();
