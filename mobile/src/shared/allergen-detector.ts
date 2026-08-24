import {
  AllergenRestrictionCode,
  AllergenWarning,
  UserProfile,
  DietaryPreferenceCode,
} from './types';
import { MASTER_ALLERGENS } from './constants';

// Comprehensive Indian and Global Allergen & Ingredient Aliases
export const ALLERGEN_ALIAS_MAP: Record<AllergenRestrictionCode, string[]> = {
  milk: [
    'sodium caseinate',
    'full cream milk',
    'skimmed milk',
    'lactalbumin',
    'milk powder',
    'milk solids',
    'buttermilk',
    'lactose',
    'milkfat',
    'casein',
    'butter',
    'paneer',
    'cheese',
    'cream',
    'whey',
    'curd',
    'ghee',
    'milk',
    'dairy',
  ],
  lactose: [
    'condensed milk',
    'milk solids',
    'milk powder',
    'milk sugar',
    'lactose',
    'whey',
    'milk',
  ],
  peanut: [
    'groundnuts',
    'peanut oil',
    'arachis oil',
    'monkey nut',
    'groundnut',
    'peanuts',
    'peanut',
  ],
  tree_nuts: [
    'pistachios',
    'hazelnuts',
    'brazil nut',
    'pistachio',
    'macadamia',
    'hazelnut',
    'pine nut',
    'almonds',
    'cashews',
    'walnuts',
    'akhrot',
    'almond',
    'cashew',
    'walnut',
    'pecan',
    'badam',
    'pista',
    'kaju',
  ],
  soy: [
    'hydrolyzed soy protein',
    'soya lecithin',
    'soy lecithin',
    'soy protein',
    'soybeans',
    'soybean',
    'edamame',
    'soya',
    'tofu',
    'soy',
  ],
  wheat_gluten: [
    'refined wheat flour',
    'wheat flour',
    'triticale',
    'semolina',
    'gluten',
    'barley',
    'durum',
    'maida',
    'wheat',
    'spelt',
    'suji',
    'rava',
    'atta',
    'malt',
    'rye',
  ],
  egg: [
    'mayonnaise',
    'ovalbumin',
    'egg powder',
    'egg white',
    'egg yolk',
    'lysozyme',
    'albumin',
    'eggs',
    'egg',
  ],
  fish: [
    'fish sauce',
    'fish oil',
    'anchovy',
    'tilapia',
    'salmon',
    'fish',
    'tuna',
    'cod',
  ],
  shellfish: [
    'shellfish',
    'shrimps',
    'lobster',
    'mollusc',
    'mussel',
    'oyster',
    'prawns',
    'shrimp',
    'prawn',
    'squid',
    'clam',
    'crab',
  ],
  sesame: [
    'sesame seeds',
    'sesame oil',
    'gingelly',
    'sesame',
    'tahini',
    'benne',
    'til',
  ],
};

// Known false-positive phrases e.g. "cocoa butter" is NOT dairy butter, "butternut" is NOT nut
const FALSE_POSITIVE_EXCEPTIONS: Record<string, string[]> = {
  milk: ['cocoa butter', 'shea butter', 'peanut butter', 'almond butter', 'butterfly', 'butternut'],
  tree_nuts: ['butternut', 'coconut', 'water chestnut', 'nutmeg'],
};

export function normalizeIngredientText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[-_/]/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isFalsePositive(matchedKeyword: string, fullText: string, allergen: string): boolean {
  const exceptions = FALSE_POSITIVE_EXCEPTIONS[allergen];
  if (!exceptions) return false;

  const normalized = normalizeIngredientText(fullText);
  for (const exc of exceptions) {
    if (normalized.includes(exc) && (matchedKeyword === 'butter' || matchedKeyword === 'nut')) {
      return true;
    }
  }
  return false;
}

export interface DetectAllergensInput {
  userProfile: Partial<UserProfile>;
  ingredientsList?: string[];
  ingredientsText?: string;
  detectedAllergens?: AllergenRestrictionCode[];
}

export interface AllergenDetectionResult {
  hasAllergenHazard: boolean;
  allergenWarnings: AllergenWarning[]; // Definite "Contains"
  precautionaryTraces: AllergenWarning[]; // Precautionary "May contain"
}

export function detectAllergensInIngredients(input: DetectAllergensInput): AllergenDetectionResult {
  const {
    userProfile,
    ingredientsList = [],
    ingredientsText = '',
    detectedAllergens = [],
  } = input;

  const userAllergens = userProfile.allergenRestrictions || [];
  const userPreferences = userProfile.dietaryPreferences || [];
  const customRestrictions = userProfile.customRestrictions || [];

  const allergenWarnings: AllergenWarning[] = [];
  const precautionaryTraces: AllergenWarning[] = [];

  // Parse ingredients text for "May contain" / "Traces of" precautionary sections
  const fullText = normalizeIngredientText(ingredientsText || ingredientsList.join(' '));

  let containsPart = fullText;
  let tracesPart = '';

  const tracesMatch = fullText.match(/(?:may contain|may contain traces of|traces of|produced in a facility that processes|processed on equipment that also processes)\s*:\s*(.*)/i) ||
    fullText.match(/(?:may contain|may contain traces of|traces of)\s+(.*)/i);

  if (tracesMatch) {
    tracesPart = tracesMatch[1] || '';
    containsPart = fullText.replace(tracesMatch[0], '').trim();
  }

  // 1. Process User Allergen Restrictions
  for (const allergen of userAllergens) {
    const aliases = ALLERGEN_ALIAS_MAP[allergen] || [allergen];
    const allergenMeta = MASTER_ALLERGENS.find((a) => a.code === allergen);
    const nameEn = allergenMeta ? allergenMeta.nameEn : allergen;
    const nameMl = allergenMeta ? allergenMeta.nameMl : allergen;

    let definiteMatch: string | null = null;
    let traceMatch: string | null = null;

    // Check pre-tagged detectedAllergens array (from barcode lookup)
    if (detectedAllergens.includes(allergen)) {
      definiteMatch = allergen;
    }

    // Check ingredients list & containsPart
    if (!definiteMatch && (ingredientsList.length > 0 || containsPart)) {
      for (const alias of aliases) {
        const regex = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i');
        if (regex.test(containsPart)) {
          if (!isFalsePositive(alias, containsPart, allergen)) {
            definiteMatch = alias;
            break;
          }
        }
      }
    }

    // Check tracesPart if no definite match found
    if (!definiteMatch && tracesPart) {
      for (const alias of aliases) {
        const regex = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i');
        if (regex.test(tracesPart)) {
          if (!isFalsePositive(alias, tracesPart, allergen)) {
            traceMatch = alias;
            break;
          }
        }
      }
    }

    if (definiteMatch) {
      allergenWarnings.push({
        allergen,
        matchedIngredient: definiteMatch,
        isDefinite: true,
        warningType: 'CONTAINS',
        messageEn: `Contains ${nameEn} (${definiteMatch}), matching your allergen restriction.`,
        messageMl: `നിങ്ങൾ ഒഴിവാക്കാൻ ആഗ്രഹിച്ച ${nameMl} ഇതിൽ അടങ്ങിയിരിക്കുന്നു (${definiteMatch}).`,
      });
    } else if (traceMatch) {
      precautionaryTraces.push({
        allergen,
        matchedIngredient: traceMatch,
        isDefinite: false,
        warningType: 'MAY_CONTAIN_TRACES',
        messageEn: `Precautionary Note: Package indicates product may contain traces of ${nameEn} (${traceMatch}).`,
        messageMl: `മുന്നറിയിപ്പ്: ഇതിൽ ${nameMl} ന്റെ സാന്നിധ്യം ഉണ്ടാകാൻ സാധ്യതയുണ്ട് (${traceMatch}).`,
      });
    }
  }

  // 2. Custom Ingredient Restrictions
  for (const customRest of customRestrictions) {
    const trimmed = normalizeIngredientText(customRest);
    if (!trimmed) continue;

    const regex = new RegExp(`\\b${trimmed.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (regex.test(containsPart)) {
      allergenWarnings.push({
        allergen: customRest,
        matchedIngredient: customRest,
        isDefinite: true,
        warningType: 'CONTAINS',
        messageEn: `Contains "${customRest}", matching your custom restriction entry.`,
        messageMl: `നിങ്ങളുടെ നിർദ്ദേശമായ "${customRest}" ഇതിൽ അടങ്ങിയിരിക്കുന്നു.`,
      });
    } else if (regex.test(tracesPart)) {
      precautionaryTraces.push({
        allergen: customRest,
        matchedIngredient: customRest,
        isDefinite: false,
        warningType: 'MAY_CONTAIN_TRACES',
        messageEn: `Precautionary Note: Package indicates product may contain traces of "${customRest}".`,
        messageMl: `മുന്നറിയിപ്പ്: ഇതിൽ "${customRest}" ന്റെ സാന്നിധ്യം ഉണ്ടാകാൻ സാധ്യതയുണ്ട്.`,
      });
    }
  }

  // 3. Vegetarian / Vegan Preferences
  if (userPreferences.includes('vegan') || userPreferences.includes('vegetarian')) {
    const nonVegKeywords = ['chicken', 'mutton', 'beef', 'pork', 'meat', 'gelatin', 'fish', 'prawn', 'crab', 'egg', 'lard'];
    if (userPreferences.includes('vegan')) {
      nonVegKeywords.push(...(ALLERGEN_ALIAS_MAP.milk || []));
    }

    for (const kw of nonVegKeywords) {
      const regex = new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (regex.test(containsPart) && !isFalsePositive(kw, containsPart, 'milk')) {
        allergenWarnings.push({
          allergen: userPreferences.includes('vegan') ? 'vegan_mismatch' : 'vegetarian_mismatch',
          matchedIngredient: kw,
          isDefinite: true,
          warningType: 'CONTAINS',
          messageEn: `Dietary Preference Alert: Contains non-plant/non-vegetarian ingredient (${kw}).`,
          messageMl: `സസ്യഭക്ഷണത്തിന് അനുയോജ്യമല്ലാത്ത ചേരുവ അടങ്ങിയിരിക്കുന്നു: ${kw}`,
        });
        break;
      }
    }
  }

  const hasAllergenHazard = allergenWarnings.length > 0;

  return {
    hasAllergenHazard,
    allergenWarnings,
    precautionaryTraces,
  };
}
