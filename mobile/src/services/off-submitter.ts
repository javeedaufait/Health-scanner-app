import { Product } from '@health-scanner/shared';

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
  private static readonly WRITE_API_URL = 'https://in.openfoodfacts.org/cgi/product_jso.pl';
  private static readonly IMAGE_API_URL = 'https://world.openfoodfacts.org/cgi/product_image_upload.pl';

  /**
   * Submit product metadata & photos to OpenFoodFacts asynchronously in background
   */
  static async submitProductToOpenFoodFacts(
    payload: OpenFoodFactsSubmissionPayload
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (payload.isEdibleFood === false) {
        return { success: false, message: 'Non-food items are not submitted to OpenFoodFacts database.' };
      }

      const barcode = payload.barcode.trim();
      if (!barcode) return { success: false, message: 'Invalid barcode' };

      // 1. Build metadata form data payload for OpenFoodFacts CGI API
      const formData = new URLSearchParams();
      formData.append('code', barcode);
      formData.append('user_id', 'health_scanner_app');
      formData.append('password', 'open_contributor'); // Anonymous / App contributor account
      formData.append('product_name', payload.productName);
      if (payload.brand) formData.append('brands', payload.brand);
      if (payload.category) formData.append('categories', payload.category);
      if (payload.servingSize) formData.append('serving_size', payload.servingSize);
      if (payload.ingredientsText) formData.append('ingredients_text', payload.ingredientsText);

      const n = payload.nutrition;
      if (n.energyKcal != null) formData.append('nutriment_energy-kcal_100g', String(n.energyKcal));
      if (n.carbohydratesG != null) formData.append('nutriment_carbohydrates_100g', String(n.carbohydratesG));
      if (n.sugarsG != null) formData.append('nutriment_sugars_100g', String(n.sugarsG));
      if (n.addedSugarsG != null) formData.append('nutriment_added-sugars_100g', String(n.addedSugarsG));
      if (n.proteinG != null) formData.append('nutriment_proteins_100g', String(n.proteinG));
      if (n.fatG != null) formData.append('nutriment_fat_100g', String(n.fatG));
      if (n.saturatedFatG != null) formData.append('nutriment_saturated-fat_100g', String(n.saturatedFatG));
      if (n.transFatG != null) formData.append('nutriment_trans-fat_100g', String(n.transFatG));
      if (n.fibreG != null) formData.append('nutriment_fiber_100g', String(n.fibreG));
      if (n.sodiumMg != null) formData.append('nutriment_sodium_100g', String(n.sodiumMg / 1000));
      if (n.saltG != null) formData.append('nutriment_salt_100g', String(n.saltG));

      formData.append('comment', 'Contributed via AI Health Scanner India Mobile App');

      // Send metadata asynchronously
      const metaRes = await fetch(this.WRITE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'AIFoodScanner-Kerala-MVP/1.0',
        },
        body: formData.toString(),
      });

      if (!metaRes.ok) {
        console.warn('OpenFoodFacts metadata post warning:', metaRes.status);
      }

      // 2. Upload images if available
      if (payload.imagesBase64 && payload.imagesBase64.length > 0) {
        for (let i = 0; i < payload.imagesBase64.length; i++) {
          const imgBase64 = payload.imagesBase64[i];
          if (!imgBase64) continue;

          const imgForm = new FormData();
          imgForm.append('code', barcode);
          imgForm.append('user_id', 'health_scanner_app');
          imgForm.append('password', 'open_contributor');
          imgForm.append('imagefield', i === 0 ? 'front_en' : i === 1 ? 'nutrition_en' : 'ingredients_en');
          imgForm.append(`imgupload_${i === 0 ? 'front' : i === 1 ? 'nutrition' : 'ingredients'}`, {
            uri: `data:image/jpeg;base64,${imgBase64}`,
            name: `label_${i}.jpg`,
            type: 'image/jpeg',
          } as any);

          fetch(this.IMAGE_API_URL, {
            method: 'POST',
            headers: {
              'User-Agent': 'AIFoodScanner-Kerala-MVP/1.0',
            },
            body: imgForm,
          }).catch((err) => console.warn('OpenFoodFacts image upload background log:', err));
        }
      }

      return { success: true, message: 'Successfully contributed product to OpenFoodFacts database.' };
    } catch (err: any) {
      console.warn('OpenFoodFacts background submission log:', err.message);
      return { success: false, message: err.message || 'Background sync failed' };
    }
  }
}
