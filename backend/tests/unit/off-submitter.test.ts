import { OpenFoodFactsSubmitter, OpenFoodFactsSubmissionPayload } from '../../src/modules/rule-engine/off-submitter';

describe('OpenFoodFacts Background Submitter', () => {
  it('should generate valid OpenFoodFacts payload format', async () => {
    const payload: OpenFoodFactsSubmissionPayload = {
      barcode: '8901719134845',
      productName: 'Parle-G Biscuit',
      brand: 'Parle',
      category: 'Biscuits',
      nutrition: {
        energyKcal: 450,
        sugarsG: 24,
        sodiumMg: 350,
      },
    };

    // Verify method runs safely without throwing
    const result = await OpenFoodFactsSubmitter.submitProductToOpenFoodFacts(payload);
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });

  it('should reject non-food product submissions', async () => {
    const nonFoodPayload: OpenFoodFactsSubmissionPayload = {
      barcode: '8901207055096',
      isEdibleFood: false,
      productName: 'Dabur Red Toothpaste',
      brand: 'Dabur',
      category: 'Personal Care',
      nutrition: {},
    };

    const result = await OpenFoodFactsSubmitter.submitProductToOpenFoodFacts(nonFoodPayload);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Non-food');
  });
});
