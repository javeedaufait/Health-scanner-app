import { compareProductsForUser } from '../../src/modules/rule-engine/comparator';
import { Product, UserProfile } from '@health-scanner/shared';

describe('Side-by-Side Product Comparator Engine', () => {
  const sampleProfile: Partial<UserProfile> = {
    conditions: ['diabetes'],
    allergenRestrictions: ['milk'],
  };

  const productA: Product = {
    id: 'prod-a',
    name: 'Oats Digestive Biscuit A',
    brand: 'Brand A',
    nutritionPer100g: {
      energyKcal: 410,
      carbohydratesG: 60,
      addedSugarsG: 4, // Low added sugar
      sugarsG: 5,
      proteinG: 10,
      fatG: 12,
      sodiumMg: 200,
    },
    ingredientsList: ['whole oats', 'wheat flour', 'vegetable oil'],
    detectedAllergens: [],
    source: 'internal',
    sourceConfidence: 1,
  };

  const productB: Product = {
    id: 'prod-b',
    name: 'Sweet Milk Cream Biscuit B',
    brand: 'Brand B',
    nutritionPer100g: {
      energyKcal: 490,
      carbohydratesG: 70,
      addedSugarsG: 22, // High added sugar
      sugarsG: 25,
      proteinG: 4,
      fatG: 20,
      sodiumMg: 500,
    },
    ingredientsList: ['refined wheat flour', 'sugar', 'milk solids', 'palm oil'],
    detectedAllergens: ['milk'],
    source: 'internal',
    sourceConfidence: 1,
  };

  it('should rank Product A over Product B because Product B contains allergen hazard (milk)', () => {
    const result = compareProductsForUser([productA, productB], sampleProfile);

    expect(result.winnerProductId).toBe('prod-a');
    expect(result.items[0].product.id).toBe('prod-a');
    expect(result.items[0].isWinner).toBe(true);

    expect(result.comparisonHighlightsEn.length).toBeGreaterThan(0);
    expect(result.comparisonHighlightsEn[0]).toContain('safer for your profile');
  });

  it('should rank low-sugar item above high-sugar item when neither has allergen hazard', () => {
    const cleanProfile: Partial<UserProfile> = {
      conditions: ['diabetes'],
      allergenRestrictions: [],
    };

    const productC: Product = {
      ...productB,
      id: 'prod-c',
      name: 'Sweet Biscuit C',
      ingredientsList: ['wheat flour', 'sugar', 'palm oil'],
      detectedAllergens: [],
    };

    const result = compareProductsForUser([productA, productC], cleanProfile);

    expect(result.winnerProductId).toBe('prod-a');
    expect(result.items.find((i) => i.product.id === 'prod-a')?.rank).toBe(1);
    expect(result.comparisonHighlightsEn.some((h) => h.includes('less sugar'))).toBe(true);
  });
});
