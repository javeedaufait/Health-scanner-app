import {
  detectAllergensInIngredients,
  normalizeIngredientText,
} from '../../src/modules/rule-engine/allergen-detector';

describe('Ingredient & Allergen Detection Engine', () => {
  describe('Text Normalization', () => {
    it('should normalize case, punctuation, and hyphenation', () => {
      expect(normalizeIngredientText('MILK-SOLIDS.')).toBe('milk solids');
      expect(normalizeIngredientText('Soya-Lecithin (E322)')).toBe('soya lecithin e322');
      expect(normalizeIngredientText('Wheat (Atta), Sugar & Salt')).toBe('wheat atta sugar salt');
    });
  });

  describe('Alias Matching (Indian & Global)', () => {
    it('should match Indian & global dairy aliases (whey, casein, ghee, paneer, milk solids)', () => {
      const result = detectAllergensInIngredients({
        userProfile: { allergenRestrictions: ['milk'] },
        ingredientsList: ['Wheat Flour', 'Sugar', 'Whey Powder', 'Ghee', 'Sodium Caseinate'],
      });

      expect(result.hasAllergenHazard).toBe(true);
      expect(result.allergenWarnings.length).toBeGreaterThan(0);
      expect(result.allergenWarnings[0].warningType).toBe('CONTAINS');
      expect(['sodium caseinate', 'whey', 'ghee']).toContain(result.allergenWarnings[0].matchedIngredient);
    });

    it('should match wheat/gluten aliases (maida, atta, suji, rava, semolina)', () => {
      const result = detectAllergensInIngredients({
        userProfile: { allergenRestrictions: ['wheat_gluten'] },
        ingredientsList: ['Refined Maida', 'Sugar', 'Palm Oil'],
      });

      expect(result.hasAllergenHazard).toBe(true);
      expect(result.allergenWarnings[0].matchedIngredient).toBe('maida');
    });

    it('should match peanut aliases (groundnut, arachis oil)', () => {
      const result = detectAllergensInIngredients({
        userProfile: { allergenRestrictions: ['peanut'] },
        ingredientsList: ['Refined Groundnut Oil', 'Salt', 'Spices'],
      });

      expect(result.hasAllergenHazard).toBe(true);
      expect(result.allergenWarnings[0].matchedIngredient).toBe('groundnut');
    });

    it('should match tree nut aliases (kaju, badam, pista, akhrot, cashew, almond)', () => {
      const result = detectAllergensInIngredients({
        userProfile: { allergenRestrictions: ['tree_nuts'] },
        ingredientsList: ['Roasted Kaju', 'Badam slices', 'Sugar'],
      });

      expect(result.hasAllergenHazard).toBe(true);
      expect(['badam', 'kaju']).toContain(result.allergenWarnings[0].matchedIngredient);
    });

    it('should match soy aliases (soya, soy lecithin)', () => {
      const result = detectAllergensInIngredients({
        userProfile: { allergenRestrictions: ['soy'] },
        ingredientsText: 'Ingredients: Cocoa mass, sugar, emulsifier (soya lecithin).',
      });

      expect(result.hasAllergenHazard).toBe(true);
      expect(result.allergenWarnings[0].matchedIngredient).toBe('soya lecithin');
    });
  });

  describe('Distinguishing "CONTAINS" vs "MAY CONTAIN TRACES OF"', () => {
    it('should classify direct ingredient match as CONTAINS (Definite Hazard)', () => {
      const result = detectAllergensInIngredients({
        userProfile: { allergenRestrictions: ['milk'] },
        ingredientsText: 'Ingredients: Wheat flour, sugar, milk solids, palm oil.',
      });

      expect(result.hasAllergenHazard).toBe(true);
      expect(result.allergenWarnings.length).toBe(1);
      expect(result.allergenWarnings[0].warningType).toBe('CONTAINS');
      expect(result.precautionaryTraces.length).toBe(0);
    });

    it('should classify precautionary "may contain" section as MAY_CONTAIN_TRACES without setting hasAllergenHazard to true', () => {
      const result = detectAllergensInIngredients({
        userProfile: { allergenRestrictions: ['peanut'] },
        ingredientsText: 'Ingredients: Oats, honey, raisins. May contain traces of peanuts and tree nuts.',
      });

      expect(result.hasAllergenHazard).toBe(false); // Does NOT set hazard override for traces
      expect(result.allergenWarnings.length).toBe(0);
      expect(result.precautionaryTraces.length).toBeGreaterThan(0);
      expect(result.precautionaryTraces[0].warningType).toBe('MAY_CONTAIN_TRACES');
      expect(result.precautionaryTraces[0].isDefinite).toBe(false);
      expect(result.precautionaryTraces[0].matchedIngredient).toBe('peanuts');
    });
  });

  describe('False Positives Prevention', () => {
    it('should NOT trigger dairy warning for cocoa butter or shea butter', () => {
      const result = detectAllergensInIngredients({
        userProfile: { allergenRestrictions: ['milk'] },
        ingredientsText: 'Ingredients: Cocoa mass, sugar, cocoa butter, vanilla extract.',
      });

      expect(result.hasAllergenHazard).toBe(false);
      expect(result.allergenWarnings.length).toBe(0);
    });
  });

  describe('Missing Ingredient Data Handling', () => {
    it('should NEVER infer allergens when ingredient text or list is empty/missing', () => {
      const result = detectAllergensInIngredients({
        userProfile: { allergenRestrictions: ['milk', 'peanut', 'tree_nuts'] },
        ingredientsList: [],
        ingredientsText: '',
      });

      expect(result.hasAllergenHazard).toBe(false);
      expect(result.allergenWarnings.length).toBe(0);
      expect(result.precautionaryTraces.length).toBe(0);
    });
  });
});
