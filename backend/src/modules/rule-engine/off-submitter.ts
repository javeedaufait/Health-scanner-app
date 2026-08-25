export interface OpenFoodFactsSubmissionPayload {
  barcode: string;
  isEdibleFood?: boolean;
  productName: string;
  brand?: string;
  category?: string;
  servingSize?: string;
  ingredientsText?: string;
  nutrition: {
    energyKcal?: number | null;
    carbohydratesG?: number | null;
    sugarsG?: number | null;
    addedSugarsG?: number | null;
    proteinG?: number | null;
    fatG?: number | null;
    saturatedFatG?: number | null;
    transFatG?: number | null;
    fibreG?: number | null;
    sodiumMg?: number | null;
    saltG?: number | null;
  };
  imagesBase64?: string[];
}

export class OpenFoodFactsSubmitter {
  static async submitProductToOpenFoodFacts(
    payload: OpenFoodFactsSubmissionPayload
  ): Promise<{ success: boolean; message: string }> {
    if (payload.isEdibleFood === false) {
      return { success: false, message: 'Non-food items are not submitted to OpenFoodFacts database.' };
    }
    if (!payload.barcode) return { success: false, message: 'Invalid barcode' };
    return { success: true, message: 'OpenFoodFacts payload verified' };
  }
}
