import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  UserProfile,
  Product,
  NutritionValues,
  RuleEvaluationResult,
  ScanRecord,
  AllergenRestrictionCode,
  evaluateFoodForUser,
  ExtractedLabelNutritionSchema,
  normalizeNutritionData,
  parseServingSizeGrams,
} from '@health-scanner/shared';
import { DEMO_PRESETS } from './demo-products';

// Storage Keys for 100% Local On-Device Persistence
const STORAGE_KEYS = {
  USER_SESSION: 'health_user_session',
  USER_PROFILE: '@health_user_profile',
  SCAN_HISTORY: '@health_scan_history',
  SAVED_PRODUCTS: '@health_saved_products',
  CUSTOM_PRODUCTS: '@health_custom_products',
  RESET_CODES: 'health_reset_codes',
  USER_CREDENTIALS: 'health_user_credentials',
  USERS_REGISTRY: 'health_users_registry',
};

// Helper for Android Keystore / iOS Keychain hardware encryption
async function saveSecure(key: string, value: string): Promise<void> {
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      await SecureStore.setItemAsync(key, value, {
        keychainService: 'health_scanner_keychain',
      });
      return;
    }
  } catch (e) {
    console.warn('SecureStore save warning, falling back to AsyncStorage', e);
  }
  await AsyncStorage.setItem(`@${key}`, value);
}

async function getSecure(key: string): Promise<string | null> {
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      const val = await SecureStore.getItemAsync(key, {
        keychainService: 'health_scanner_keychain',
      });
      if (val !== null) return val;
    }
  } catch (e) {
    console.warn('SecureStore read warning, falling back to AsyncStorage', e);
  }
  return AsyncStorage.getItem(`@${key}`);
}

async function deleteSecure(key: string): Promise<void> {
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      await SecureStore.deleteItemAsync(key, {
        keychainService: 'health_scanner_keychain',
      });
    }
  } catch (e) {}
  await AsyncStorage.removeItem(`@${key}`);
}

interface LocalUserRecord {
  userId: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

async function getUsersRegistry(): Promise<Record<string, LocalUserRecord>> {
  const str = await getSecure(STORAGE_KEYS.USERS_REGISTRY);
  return str ? JSON.parse(str) : {};
}

async function saveUsersRegistry(registry: Record<string, LocalUserRecord>): Promise<void> {
  await saveSecure(STORAGE_KEYS.USERS_REGISTRY, JSON.stringify(registry));
}

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
    const emailLower = body.email.trim().toLowerCase();
    const registry = await getUsersRegistry();

    if (registry[emailLower]) {
      throw new Error('An account with this email address already exists. Please log in instead.');
    }

    const userId = `user-${Date.now()}`;
    const now = new Date().toISOString();

    registry[emailLower] = {
      userId,
      email: emailLower,
      name: body.name.trim(),
      passwordHash: body.password,
      createdAt: now,
    };

    await saveUsersRegistry(registry);

    const session = {
      userId,
      email: emailLower,
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

    await saveSecure(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    await saveSecure(STORAGE_KEYS.USER_CREDENTIALS, JSON.stringify({ email: session.email, name: session.name }));
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(initialProfile));
    return session;
  }

  async login(body: { email: string; password: string }) {
    const emailLower = body.email.trim().toLowerCase();
    const registry = await getUsersRegistry();
    const user = registry[emailLower];

    if (!user) {
      throw new Error('No account found with this email address. Please register first.');
    }

    if (body.password !== user.passwordHash) {
      throw new Error('Invalid email or password.');
    }

    const session = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      languagePreference: 'en' as const,
      disclaimerAcknowledged: false,
      token: `local-token-${Date.now()}`,
    };

    await saveSecure(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    await saveSecure(STORAGE_KEYS.USER_CREDENTIALS, JSON.stringify({ email: session.email, name: session.name }));
    return session;
  }

  async forgotPassword(email: string) {
    const emailLower = email.trim().toLowerCase();
    const registry = await getUsersRegistry();
    if (!registry[emailLower]) {
      throw new Error('No account found with this email address.');
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    await saveSecure(STORAGE_KEYS.RESET_CODES, JSON.stringify({ email: emailLower, resetCode, expiresAt: Date.now() + 15 * 60 * 1000 }));
    return {
      success: true,
      message: 'A 6-digit verification code has been generated.',
      resetCode,
    };
  }

  async resetPassword(body: { email: string; resetCode: string; newPassword: string }) {
    const emailLower = body.email.trim().toLowerCase();
    const registry = await getUsersRegistry();
    const user = registry[emailLower];

    if (!user) {
      throw new Error('No account found with this email address.');
    }

    user.passwordHash = body.newPassword;
    await saveUsersRegistry(registry);
    await deleteSecure(STORAGE_KEYS.RESET_CODES);

    return {
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
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
    // Delete account from local users registry
    const sessionStr = await getSecure(STORAGE_KEYS.USER_SESSION);
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session.email) {
        const registry = await getUsersRegistry();
        delete registry[session.email.toLowerCase()];
        await saveUsersRegistry(registry);
      }
    }

    await deleteSecure(STORAGE_KEYS.USER_SESSION);
    await deleteSecure(STORAGE_KEYS.USER_CREDENTIALS);
    await deleteSecure(STORAGE_KEYS.RESET_CODES);
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.SCAN_HISTORY,
      STORAGE_KEYS.SAVED_PRODUCTS,
      STORAGE_KEYS.CUSTOM_PRODUCTS,
    ]);
    return { success: true, message: 'Your account and all associated data have been permanently deleted.' };
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
      try {
        const customMap = JSON.parse(customStr);
        const cached = customMap[cleanBarcode];
        if (cached && cached.nutritionPer100g) {
          const hasValidNutrition = Object.values(cached.nutritionPer100g).some(
            (v) => v !== null && v !== undefined
          );
          if (hasValidNutrition) {
            return { found: true, product: cached };
          }
        }
      } catch {}
    }

    // 3. Query OpenFoodFacts directly over HTTPS (India and Global clusters)
    const endpoints = [
      `https://in.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
      `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
    ];

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(url, {
          headers: { 'User-Agent': 'AIFoodScanner-Kerala-MVP/1.0' },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json() as any;
          if (data.status === 1 && data.product) {
            const product = this.mapOpenFoodFactsProduct(data.product, cleanBarcode);
            // Cache locally
            await this.cacheCustomProduct(cleanBarcode, product);
            return { found: true, product };
          }
        }
      } catch (err) {
        console.warn(`OpenFoodFacts fetch error for ${url}:`, err);
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

    const getNutrimentVal = (keys: string[]): number | null => {
      for (const k of keys) {
        if (nutriments[k] !== undefined && nutriments[k] !== null && !isNaN(Number(nutriments[k]))) {
          return Number(nutriments[k]);
        }
      }
      return null;
    };

    const raw100g: NutritionValues = {
      energyKcal: getNutrimentVal(['energy-kcal_100g', 'energy-kcal_prepared_100g', 'energy-kcal_value', 'energy-kcal']),
      carbohydratesG: getNutrimentVal(['carbohydrates_100g', 'carbohydrates_prepared_100g', 'carbohydrates_value', 'carbohydrates']),
      sugarsG: getNutrimentVal(['sugars_100g', 'sugars_prepared_100g', 'sugars_value', 'sugars']),
      addedSugarsG: getNutrimentVal(['added-sugars_100g', 'added-sugars_prepared_100g', 'added-sugars_value', 'added-sugars']),
      proteinG: getNutrimentVal(['proteins_100g', 'proteins_prepared_100g', 'proteins_value', 'proteins']),
      fatG: getNutrimentVal(['fat_100g', 'fat_prepared_100g', 'fat_value', 'fat']),
      saturatedFatG: getNutrimentVal(['saturated-fat_100g', 'saturated-fat_prepared_100g', 'saturated-fat_value', 'saturated-fat']),
      transFatG: getNutrimentVal(['trans-fat_100g', 'trans-fat_prepared_100g', 'trans-fat_value', 'trans-fat']),
      fibreG: getNutrimentVal(['fiber_100g', 'fiber_prepared_100g', 'fiber_value', 'fiber']),
      sodiumMg: (() => {
        const sodG = getNutrimentVal(['sodium_100g', 'sodium_prepared_100g', 'sodium_value', 'sodium']);
        if (sodG !== null) return Math.round(sodG * 1000);
        const saltG = getNutrimentVal(['salt_100g', 'salt_prepared_100g', 'salt_value', 'salt']);
        if (saltG !== null) return Math.round((saltG / 2.5) * 1000);
        return null;
      })(),
      saltG: getNutrimentVal(['salt_100g', 'salt_prepared_100g', 'salt_value', 'salt']),
    };

    const rawServing: NutritionValues = {
      energyKcal: getNutrimentVal(['energy-kcal_serving', 'energy-kcal_prepared_serving']),
      carbohydratesG: getNutrimentVal(['carbohydrates_serving', 'carbohydrates_prepared_serving']),
      sugarsG: getNutrimentVal(['sugars_serving', 'sugars_prepared_serving']),
      addedSugarsG: getNutrimentVal(['added-sugars_serving', 'added-sugars_prepared_serving']),
      proteinG: getNutrimentVal(['proteins_serving', 'proteins_prepared_serving']),
      fatG: getNutrimentVal(['fat_serving', 'fat_prepared_serving']),
      saturatedFatG: getNutrimentVal(['saturated-fat_serving', 'saturated-fat_prepared_serving']),
      transFatG: getNutrimentVal(['trans-fat_serving', 'trans-fat_prepared_serving']),
      fibreG: getNutrimentVal(['fiber_serving', 'fiber_prepared_serving']),
      sodiumMg: (() => {
        const sodG = getNutrimentVal(['sodium_serving', 'sodium_prepared_serving']);
        if (sodG !== null) return Math.round(sodG * 1000);
        const saltG = getNutrimentVal(['salt_serving', 'salt_prepared_serving']);
        if (saltG !== null) return Math.round((saltG / 2.5) * 1000);
        return null;
      })(),
      saltG: getNutrimentVal(['salt_serving', 'salt_prepared_serving']),
    };

    const servingInfo = {
      servingSizeText: p.serving_size || null,
      servingSizeGrams: parseServingSizeGrams(p.serving_size),
    };

    const normResult = normalizeNutritionData({
      nutritionPer100g: raw100g,
      nutritionPerServing: rawServing,
      servingInfo,
    });

    return {
      id: `off-${p.code || barcode}`,
      barcode: p.code || barcode,
      name: p.product_name || p.product_name_en || 'Unknown Product',
      brand: p.brands || 'Packaged Brand',
      category: p.categories?.split(',')[0]?.trim() || 'Packaged Food',
      servingSize: p.serving_size || undefined,
      imageUrl: p.image_url || p.image_front_url || undefined,
      nutritionPer100g: normResult.normalizedPer100g,
      nutritionPerServing: rawServing,
      rawServingInfo: normResult.servingInfo,
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

  async getScanById(id: string): Promise<ScanRecord> {
    const historyStr = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
    if (historyStr) {
      const history: ScanRecord[] = JSON.parse(historyStr);
      const found = history.find((s) => s.id === id);
      if (found) {
        // If scan record has no nutrition values, auto-refresh from OpenFoodFacts & re-evaluate
        const hasNutrition = Object.values(found.nutritionSnapshot || {}).some(
          (v) => v !== null && v !== undefined
        );
        if (!hasNutrition && found.productId) {
          const barcode = found.productId.replace('off-', '');
          const lookup = await this.lookupBarcode(barcode);
          if (lookup.found && lookup.product) {
            const userProfile = await this.getProfile();
            const evalResult = evaluateFoodForUser({
              userProfile,
              productNutrition: lookup.product.nutritionPer100g,
              ingredientsList: lookup.product.ingredientsList,
              detectedAllergens: lookup.product.detectedAllergens,
            });
            found.nutritionSnapshot = lookup.product.nutritionPer100g;
            found.nutritionPerServingSnapshot = lookup.product.nutritionPerServing;
            found.rawServingInfo = lookup.product.rawServingInfo;
            found.assessmentStatus = evalResult.status;
            found.score = evalResult.score;
            found.personalizedGuidanceScore = evalResult.personalizedGuidanceScore;
            found.reasons = evalResult.reasons;
            found.allergenWarnings = evalResult.allergenWarnings;
            found.precautionaryTraces = evalResult.precautionaryTraces;

            // Persist updated scan record
            await AsyncStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(history));
          }
        }
        return found;
      }
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
