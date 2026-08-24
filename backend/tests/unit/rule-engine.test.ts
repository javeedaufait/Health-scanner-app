import { evaluateFoodForUser } from '../../src/modules/rule-engine/evaluator';

describe('Deterministic Health Rule Evaluation Engine (FSSAI, ICMR-NIN & WHO Audited)', () => {
  describe('Rule Set Version & Canonical Metadata', () => {
    it('should include ruleSetVersion and canonical personalizedGuidanceScore on evaluation output', () => {
      const result = evaluateFoodForUser({
        userProfile: { conditions: ['none'] },
        productNutrition: { energyKcal: 100, sodiumMg: 20 },
      });

      expect(result.ruleSetVersion).toBe('2026.1-audited');
      expect(result.personalizedGuidanceScore).toBe(100);
      expect(result.score).toBe(100); // Deprecated alias
    });
  });

  describe('Diabetes & Blood Sugar Guidance Rules', () => {
    it('should flag High Added Sugar for a user with Diabetes with Draft FSSAI FoPL benchmark metadata', () => {
      const result = evaluateFoodForUser({
        userProfile: { conditions: ['diabetes'] },
        productNutrition: {
          energyKcal: 450,
          carbohydratesG: 70,
          addedSugarsG: 22, // High added sugar (>=10g)
          sugarsG: 25,
          proteinG: 5,
          fatG: 12,
          sodiumMg: 200,
        },
        ingredientsList: ['wheat flour', 'sugar', 'palm oil'],
      });

      expect(result.status).not.toBe('GOOD_CHOICE');
      expect(result.personalizedGuidanceScore).toBeLessThanOrEqual(70);
      const sugarReason = result.reasons.find((r) => r.conditionCode === 'diabetes' && r.nutrient === 'addedSugarsG');
      expect(sugarReason).toBeDefined();
      expect(sugarReason?.classification).toBe('INDIRECTLY_SUPPORTED');
      expect(sugarReason?.source).toContain('Draft FSSAI FoPL');
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
      expect(result.personalizedGuidanceScore).toBeGreaterThanOrEqual(80);
      expect(result.reasons.length).toBe(0);
    });
  });

  describe('Hypertension & Sodium Rules (FSSAI 600mg / WHO 800mg Benchmarks)', () => {
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
      expect(sodiumReason?.classification).toBe('INDIRECTLY_SUPPORTED');
    });

    it('should flag High Sodium at FSSAI 600mg threshold', () => {
      const result = evaluateFoodForUser({
        userProfile: { conditions: ['hypertension'] },
        productNutrition: {
          energyKcal: 300,
          sodiumMg: 650, // High sodium (>=600mg)
        },
        ingredientsList: ['wheat flour', 'salt'],
      });

      expect(result.reasons.some((r) => r.nutrient === 'sodiumMg' && r.threshold === 600)).toBe(true);
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
      expect(result.personalizedGuidanceScore).toBe(100);
    });
  });

  describe('Cholesterol & Saturated / Trans Fat Rules', () => {
    it('should flag High Saturated Fat (>=5g) and Trans Fat (>0.2g FSSAI claim limit)', () => {
      const result = evaluateFoodForUser({
        userProfile: { conditions: ['high_cholesterol'] },
        productNutrition: {
          energyKcal: 540,
          saturatedFatG: 15.2, // High saturated fat
          transFatG: 0.3, // Exceeds 0.2g FSSAI claim limit
          fatG: 34,
        },
        ingredientsList: ['potato', 'palm oil', 'salt'],
      });

      expect(result.status).toBe('NOT_A_GOOD_CHOICE');
      const transReason = result.reasons.find((r) => r.nutrient === 'transFatG');
      expect(transReason).toBeDefined();
      expect(transReason?.threshold).toBe(0.2);
      expect(transReason?.classification).toBe('INDIRECTLY_SUPPORTED');
    });
  });

  describe('Kidney Disease Non-Clinical Advisory', () => {
    it('should provide kidney disease advisory without deducting score points', () => {
      const result = evaluateFoodForUser({
        userProfile: { conditions: ['kidney_disease'] },
        productNutrition: {
          energyKcal: 200,
          sodiumMg: 100,
        },
        ingredientsList: ['rice flour', 'water'],
      });

      expect(result.personalizedGuidanceScore).toBe(100);
      expect(result.kidneyAdvisoryEn).toContain('Kidney disease requires personalized clinical management');
      expect(result.kidneyAdvisoryMl).toContain('വൃക്കരോഗമുള്ളവർ');
    });
  });

  describe('Missing Nutrition Data Handling', () => {
    it('should mark null/missing fields as UNKNOWN and set isMissingNutritionData flag without deducting false score points', () => {
      const result = evaluateFoodForUser({
        userProfile: { conditions: ['hypertension'] },
        productNutrition: {
          energyKcal: 250,
          sodiumMg: null, // Missing field
          addedSugarsG: undefined,
        },
        ingredientsList: ['wheat flour'],
      });

      expect(result.isMissingNutritionData).toBe(true);
      expect(result.missingFields).toContain('sodiumMg');
      expect(result.missingFields).toContain('addedSugarsG');
      expect(result.personalizedGuidanceScore).toBe(100); // No points deducted for unknown values
    });
  });

  describe('Allergen Biological Safety Engine', () => {
    it('should trigger ALLERGEN HAZARD and NOT_A_GOOD_CHOICE independently when user with milk allergy scans product with milk solids', () => {
      const result = evaluateFoodForUser({
        userProfile: {
          conditions: ['none'],
          allergenRestrictions: ['milk'],
        },
        productNutrition: { energyKcal: 400, fatG: 10 },
        ingredientsList: ['wheat flour', 'sugar', 'milk solids', 'butter'],
      });

      expect(result.status).toBe('NOT_A_GOOD_CHOICE');
      expect(result.hasAllergenHazard).toBe(true);
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
      expect(result.hasAllergenHazard).toBe(false);
      expect(result.allergenWarnings.length).toBe(0);
    });
  });

  describe('Complex Acceptance Test Scenario', () => {
    it('should evaluate Demo User (Diabetes + Hypertension + Milk restriction) on Demo Snack', () => {
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
          transFatG: 0.3,
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

      expect(result.ruleSetVersion).toBe('2026.1-audited');
      expect(result.status).toBe('NOT_A_GOOD_CHOICE');
      expect(result.hasAllergenHazard).toBe(true);

      const sugarConcern = result.reasons.find((r) => r.conditionCode === 'diabetes');
      expect(sugarConcern).toBeDefined();

      const sodiumConcern = result.reasons.find((r) => r.conditionCode === 'hypertension');
      expect(sodiumConcern).toBeDefined();

      const milkWarning = result.allergenWarnings.find((a) => a.allergen === 'milk');
      expect(milkWarning).toBeDefined();

      expect(result.overallSummaryEn).toBeTruthy();
      expect(result.overallSummaryMl).toBeTruthy();
    });
  });
});
