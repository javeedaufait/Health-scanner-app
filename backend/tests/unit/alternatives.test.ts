import { findBetterAlternatives } from '@health-scanner/shared';
import { Product, UserProfile } from '@health-scanner/shared';

describe('Better Alternatives Recommendation Engine', () => {
  const userWithDiabetes: Partial<UserProfile> = {
    conditions: ['diabetes'],
    allergenRestrictions: [],
    dietaryPreferences: [],
  };

  const highSugarBiscuit: Product = {
    id: 'biscuit-1',
    name: 'High Sugar Cream Biscuit',
    category: 'Biscuits',
    nutritionPer100g: {
      energyKcal: 480,
      carbohydratesG: 70,
      sugarsG: 35,
      addedSugarsG: 30,
      fatG: 18,
      saturatedFatG: 8,
      proteinG: 5,
      sodiumMg: 300,
    },
    ingredientsList: ['refined wheat flour', 'sugar', 'palm oil'],
    detectedAllergens: ['wheat_gluten'],
    source: 'internal',
    sourceConfidence: 1,
  };

  const lowSugarBiscuit: Product = {
    id: 'biscuit-2',
    name: 'Oats & Ragi Digestive Biscuit',
    category: 'Biscuits',
    nutritionPer100g: {
      energyKcal: 410,
      carbohydratesG: 62,
      sugarsG: 8,
      addedSugarsG: 5,
      fatG: 11,
      saturatedFatG: 3,
      proteinG: 9,
      fibreG: 7,
      sodiumMg: 200,
    },
    ingredientsList: ['whole wheat flour', 'rolled oats', 'ragi flour', 'maltitol'],
    detectedAllergens: ['wheat_gluten'],
    source: 'internal',
    sourceConfidence: 1,
  };

  const allergenConflictBiscuit: Product = {
    id: 'biscuit-3',
    name: 'Peanut Butter Crunch Biscuit',
    category: 'Biscuits',
    nutritionPer100g: {
      energyKcal: 420,
      carbohydratesG: 60,
      sugarsG: 6,
      addedSugarsG: 4,
      fatG: 12,
      saturatedFatG: 3,
      proteinG: 12,
      sodiumMg: 200,
    },
    ingredientsList: ['whole wheat flour', 'peanuts', 'peanut butter'],
    detectedAllergens: ['wheat_gluten', 'peanut'],
    source: 'internal',
    sourceConfidence: 1,
  };

  const chipsProduct: Product = {
    id: 'chips-1',
    name: 'Potato Chips',
    category: 'Snacks & Chips',
    nutritionPer100g: {
      energyKcal: 540,
      carbohydratesG: 50,
      sugarsG: 2,
      addedSugarsG: 1,
      fatG: 35,
      saturatedFatG: 14,
      proteinG: 6,
      sodiumMg: 850,
    },
    ingredientsList: ['potato', 'palmolein oil', 'salt'],
    detectedAllergens: [],
    source: 'internal',
    sourceConfidence: 1,
  };

  it('should find low-sugar alternative in the same category for diabetic user', () => {
    const res = findBetterAlternatives({
      currentProduct: {
        id: highSugarBiscuit.id,
        category: highSugarBiscuit.category,
        nutrition: highSugarBiscuit.nutritionPer100g,
      },
      candidateProducts: [highSugarBiscuit, lowSugarBiscuit, chipsProduct],
      userProfile: userWithDiabetes,
    });

    expect(res.hasAlternatives).toBe(true);
    expect(res.alternatives.length).toBe(1);
    expect(res.alternatives[0].product.id).toBe(lowSugarBiscuit.id);
    expect(res.alternatives[0].guidanceBadgeEn).toBe('Better fit for your profile');
    expect(res.alternatives[0].comparisonReasonsEn[0]).toContain('Lower sugar');
  });

  it('should exclude candidates that conflict with user allergen restrictions', () => {
    const userWithPeanutAllergy: Partial<UserProfile> = {
      conditions: ['diabetes'],
      allergenRestrictions: ['peanut'],
      dietaryPreferences: [],
    };

    const res = findBetterAlternatives({
      currentProduct: {
        id: highSugarBiscuit.id,
        category: highSugarBiscuit.category,
        nutrition: highSugarBiscuit.nutritionPer100g,
      },
      candidateProducts: [highSugarBiscuit, allergenConflictBiscuit, lowSugarBiscuit],
      userProfile: userWithPeanutAllergy,
    });

    expect(res.hasAlternatives).toBe(true);
    expect(res.alternatives.some((a) => a.product.id === allergenConflictBiscuit.id)).toBe(false);
    expect(res.alternatives[0].product.id).toBe(lowSugarBiscuit.id);
  });

  it('should exclude the current product itself from alternatives', () => {
    const res = findBetterAlternatives({
      currentProduct: {
        id: lowSugarBiscuit.id,
        category: lowSugarBiscuit.category,
        nutrition: lowSugarBiscuit.nutritionPer100g,
      },
      candidateProducts: [lowSugarBiscuit, highSugarBiscuit],
      userProfile: userWithDiabetes,
    });

    // High sugar biscuit is worse than low sugar biscuit, so no alternatives found
    expect(res.hasAlternatives).toBe(false);
    expect(res.alternatives.length).toBe(0);
    expect(res.emptyMessageEn).toContain('No suitable alternatives');
  });
});
