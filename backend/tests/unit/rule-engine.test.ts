import { evaluateFoodForUser } from '../../src/modules/rule-engine/evaluator';

describe('Deterministic Health Rule Evaluation Engine', () => {
  describe('Diabetes & Blood Sugar Rules', () => {
    it('should flag High Added Sugar for a user with Diabetes', () => {
      const result = evaluateFoodForUser({
        userProfile: { conditions: ['diabetes'] },
        productNutrition: {
          energyKcal: 450,
          carbohydratesG: 70,
          addedSugarsG: 22, // High added sugar
          sugarsG: 25,
          proteinG: 5,
          fatG: 12,
          sodiumMg: 200,
        },
        ingredientsList: ['wheat flour', 'sugar', 'palm oil'],
      });

      expect(result.status).not.toBe('GOOD_CHOICE');
      expect(result.score).toBeLessThanOrEqual(70);
      const sugarReason = result.reasons.find((r) => r.conditionCode === 'diabetes' && r.nutrient === 'addedSugarsG');
      expect(sugarReason).toBeDefined();
      expect(sugarReason?.severity).toBe('high');
    });

    it('should grant GOOD_CHOICE to a low-sugar, high-fibre product for Diabetes', () => {
      const result = evaluateFoodForUser({
        userProfile: { conditions: ['diabetes'] },
        productNutrition: {
          energyKcal: 380,
          carbohydratesG: 60,
          addedSugarsG: 0,
          sugarsG: 1,
          proteinG: 12,
          fatG: 7,
          fibreG: 10,
          sodiumMg: 15,
        },
        ingredientsList: ['100% rolled oats'],
      });

      expect(result.status).toBe('GOOD_CHOICE');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.reasons.length).toBe(0);
    });
  });

  describe('Hypertension & Sodium Rules', () => {
    it('should flag Critical Sodium for a user with Hypertension on instant noodles', () => {
      const result = evaluateFoodForUser({
        userProfile: { conditions: ['hypertension'] },
        productNutrition: {
          energyKcal: 420,
          carbohydratesG: 63,
          sodiumMg: 1050, // Critical sodium (>800mg)
          fatG: 15,
        },
        ingredientsList: ['wheat flour', 'palm oil', 'salt', 'spices'],
      });

      expect(result.status).not.toBe('GOOD_CHOICE');
      const sodiumReason = result.reasons.find((r) => r.conditionCode === 'hypertension');
      expect(sodiumReason).toBeDefined();
      expect(sodiumReason?.severity).toBe('critical');
    });

    it('should pass low-sodium products for Hypertension', () => {
      const result = evaluateFoodForUser({
        userProfile: { conditions: ['hypertension'] },
        productNutrition: {
          energyKcal: 85,
          sodiumMg: 45, // Low sodium (<140mg)
        },
        ingredientsList: ['milk', 'cultures'],
      });

      expect(result.status).toBe('GOOD_CHOICE');
      expect(result.score).toBe(100);
    });
  });

  describe('Cholesterol & Saturated / Trans Fat Rules', () => {
    it('should flag High Saturated Fat and Trans Fat for High Cholesterol', () => {
      const result = evaluateFoodForUser({
        userProfile: { conditions: ['high_cholesterol'] },
        productNutrition: {
          energyKcal: 540,
          saturatedFatG: 15.2, // High saturated fat
          transFatG: 0.2, // Trans fat present
          fatG: 34,
        },
        ingredientsList: ['potato', 'palm oil', 'salt'],
      });

      expect(result.status).toBe('NOT_A_GOOD_CHOICE');
      expect(result.reasons.some((r) => r.nutrient === 'saturatedFatG')).toBe(true);
      expect(result.reasons.some((r) => r.nutrient === 'transFatG')).toBe(true);
    });
  });

  describe('Allergen & Dietary Restrictions', () => {
    it('should trigger ALLERGEN WARNING and NOT_A_GOOD_CHOICE when user with milk allergy scans product with milk solids', () => {
      const result = evaluateFoodForUser({
        userProfile: {
          conditions: ['none'],
          allergenRestrictions: ['milk'],
        },
        productNutrition: { energyKcal: 400, fatG: 10 },
        ingredientsList: ['wheat flour', 'sugar', 'milk solids', 'butter'],
      });

      expect(result.status).toBe('NOT_A_GOOD_CHOICE');
      expect(result.allergenWarnings.length).toBeGreaterThan(0);
      expect(result.allergenWarnings[0].allergen).toBe('milk');
      expect(result.allergenWarnings[0].matchedIngredient).toContain('milk solids');
    });

    it('should pass cleanly when no allergen matches are present', () => {
      const result = evaluateFoodForUser({
        userProfile: {
          conditions: ['none'],
          allergenRestrictions: ['peanut'],
        },
        productNutrition: { energyKcal: 350, fatG: 5 },
        ingredientsList: ['100% oats', 'water', 'salt'],
      });

      expect(result.status).toBe('GOOD_CHOICE');
      expect(result.allergenWarnings.length).toBe(0);
    });
  });

  describe('Section 56 Official Acceptance Test Scenario', () => {
    it('should evaluate Demo User (Diabetes + Hypertension + Milk restriction) on Demo Snack (High Sugar + High Sodium + Milk solids)', () => {
      const result = evaluateFoodForUser({
        userProfile: {
          conditions: ['diabetes', 'hypertension'],
          allergenRestrictions: ['milk'],
        },
        productNutrition: {
          energyKcal: 480,
          carbohydratesG: 68.0,
          sugarsG: 28.0,
          addedSugarsG: 24.0, // High sugar
          proteinG: 5.0,
          fatG: 21.0,
          saturatedFatG: 7.5,
          transFatG: 0.2,
          fibreG: 1.2,
          sodiumMg: 880, // High sodium (>800mg)
          saltG: 2.2,
        },
        ingredientsList: [
          'wheat flour',
          'sugar',
          'vegetable oil',
          'milk solids',
          'salt',
          'flavouring agents',
        ],
        detectedAllergens: ['wheat_gluten', 'milk'],
      });

      // 1. Must be NOT_A_GOOD_CHOICE due to allergen and multiple critical deductions
      expect(result.status).toBe('NOT_A_GOOD_CHOICE');

      // 2. Must contain Added Sugar concern
      const sugarConcern = result.reasons.find((r) => r.conditionCode === 'diabetes');
      expect(sugarConcern).toBeDefined();

      // 3. Must contain Sodium concern
      const sodiumConcern = result.reasons.find((r) => r.conditionCode === 'hypertension');
      expect(sodiumConcern).toBeDefined();

      // 4. Must contain Milk allergen warning
      const milkWarning = result.allergenWarnings.find((a) => a.allergen === 'milk');
      expect(milkWarning).toBeDefined();

      // 5. Must provide bilingual summaries
      expect(result.overallSummaryEn).toBeTruthy();
      expect(result.overallSummaryMl).toBeTruthy();
    });
  });
});
