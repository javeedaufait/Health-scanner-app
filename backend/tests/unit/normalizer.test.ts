import {
  normalizeNutritionData,
  parseServingSizeGrams,
} from '../../src/modules/rule-engine/normalizer';

describe('Serving Size → Per-100g Normalization Engine', () => {
  describe('Serving Size Parsing', () => {
    it('should parse explicit gram weights', () => {
      expect(parseServingSizeGrams('30g')).toBe(30);
      expect(parseServingSizeGrams('30 g')).toBe(30);
      expect(parseServingSizeGrams('1 scoop (25g)')).toBe(25);
      expect(parseServingSizeGrams('15.5 grams')).toBe(15.5);
    });

    it('should parse ml volume as gram equivalent', () => {
      expect(parseServingSizeGrams('250 ml')).toBe(250);
      expect(parseServingSizeGrams('200ml')).toBe(200);
    });

    it('should return null for ambiguous serving size descriptions without weight', () => {
      expect(parseServingSizeGrams('1 cookie')).toBeNull();
      expect(parseServingSizeGrams('1 piece')).toBeNull();
      expect(parseServingSizeGrams('1 bowl')).toBeNull();
      expect(parseServingSizeGrams('')).toBeNull();
      expect(parseServingSizeGrams(null)).toBeNull();
    });
  });

  describe('1. Already per-100g data', () => {
    it('should pass through per-100g values directly without modification', () => {
      const result = normalizeNutritionData({
        nutritionPer100g: {
          energyKcal: 450,
          addedSugarsG: 12,
          sodiumMg: 600,
        },
        servingInfo: { basis: 'per_100g' },
      });

      expect(result.conversionApplied).toBe(false);
      expect(result.normalizedPer100g.energyKcal).toBe(450);
      expect(result.normalizedPer100g.addedSugarsG).toBe(12);
      expect(result.normalizedPer100g.sodiumMg).toBe(600);
      expect(result.originalSnapshot?.addedSugarsG.basis).toBe('per_100g');
    });
  });

  describe('2. Per-Serving → Per-100g Conversion & 3. Different Serving Sizes', () => {
    it('should correctly convert 30g serving values to per-100g (30g serving with 3g sugar -> 10g/100g)', () => {
      const result = normalizeNutritionData({
        nutritionPerServing: {
          energyKcal: 135,
          addedSugarsG: 3,
          sodiumMg: 180,
        },
        servingInfo: {
          servingSizeGrams: 30,
          servingSizeText: '30g',
          basis: 'per_serving',
        },
      });

      expect(result.conversionApplied).toBe(true);
      // (135 / 30) * 100 = 450
      expect(result.normalizedPer100g.energyKcal).toBe(450);
      // (3 / 30) * 100 = 10
      expect(result.normalizedPer100g.addedSugarsG).toBe(10);
      // (180 / 30) * 100 = 600
      expect(result.normalizedPer100g.sodiumMg).toBe(600);

      // Verify original per-serving values are preserved in snapshot
      expect(result.originalSnapshot?.addedSugarsG.value).toBe(3);
      expect(result.originalSnapshot?.addedSugarsG.basis).toBe('per_serving');
    });

    it('should correctly convert 15g serving size', () => {
      const result = normalizeNutritionData({
        nutritionPerServing: {
          addedSugarsG: 1.5,
          sodiumMg: 90,
        },
        servingInfo: {
          servingSizeText: '15g',
        },
      });

      expect(result.conversionApplied).toBe(true);
      // (1.5 / 15) * 100 = 10
      expect(result.normalizedPer100g.addedSugarsG).toBe(10);
      // (90 / 15) * 100 = 600
      expect(result.normalizedPer100g.sodiumMg).toBe(600);
    });

    it('should correctly convert 50g serving size', () => {
      const result = normalizeNutritionData({
        nutritionPerServing: {
          energyKcal: 200,
          fatG: 5,
        },
        servingInfo: {
          servingSizeGrams: 50,
        },
      });

      expect(result.conversionApplied).toBe(true);
      // (200 / 50) * 100 = 400
      expect(result.normalizedPer100g.energyKcal).toBe(400);
      // (5 / 50) * 100 = 10
      expect(result.normalizedPer100g.fatG).toBe(10);
    });
  });

  describe('4. Missing or Ambiguous Serving Size', () => {
    it('should set normalized value to UNKNOWN/null and NEVER estimate when serving size is ambiguous e.g. "1 biscuit"', () => {
      const result = normalizeNutritionData({
        nutritionPerServing: {
          addedSugarsG: 4,
          sodiumMg: 150,
        },
        servingInfo: {
          servingSizeText: '1 biscuit', // Ambiguous! No weight given
        },
      });

      expect(result.conversionApplied).toBe(false);
      expect(result.normalizedPer100g.addedSugarsG).toBeNull();
      expect(result.normalizedPer100g.sodiumMg).toBeNull();
      expect(result.missingOrAmbiguousFields).toContain('addedSugarsG');
      expect(result.missingOrAmbiguousFields).toContain('sodiumMg');
    });

    it('should set normalized value to null when no serving size or per-100g data is present', () => {
      const result = normalizeNutritionData({
        servingInfo: { servingSizeText: '30g' },
      });

      expect(result.normalizedPer100g.energyKcal).toBeNull();
      expect(result.normalizedPer100g.addedSugarsG).toBeNull();
    });
  });

  describe('5. Mixed Per-Serving and Per-100g Fields', () => {
    it('should use direct per-100g field if present, and normalize per-serving field if per-100g is missing', () => {
      const result = normalizeNutritionData({
        nutritionPer100g: {
          energyKcal: 400,
          sugarsG: 15,
          // addedSugarsG missing in per100g
        },
        nutritionPerServing: {
          addedSugarsG: 3, // Per 25g serving
        },
        servingInfo: {
          servingSizeGrams: 25,
          servingSizeText: '25g',
        },
      });

      expect(result.normalizedPer100g.energyKcal).toBe(400); // Direct per-100g
      expect(result.normalizedPer100g.sugarsG).toBe(15); // Direct per-100g
      // (3 / 25) * 100 = 12
      expect(result.normalizedPer100g.addedSugarsG).toBe(12); // Converted per-serving
      expect(result.originalSnapshot?.energyKcal.basis).toBe('per_100g');
      expect(result.originalSnapshot?.addedSugarsG.basis).toBe('per_serving');
    });
  });
});
