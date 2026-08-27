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
  private static readonly WRITE_API_URL = 'https://world.openfoodfacts.org/cgi/product_jqm2.pl';
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

      const offUser = process.env.EXPO_PUBLIC_OFF_USER_ID || '';
      const offPass = process.env.EXPO_PUBLIC_OFF_PASSWORD || '';
      if (offUser && offPass) {
        formData.append('user_id', offUser);
        formData.append('password', offPass);
      }

      formData.append('product_name', payload.productName);
      if (payload.brand) formData.append('brands', payload.brand);
      if (payload.category) formData.append('categories', payload.category);
      if (payload.servingSize) formData.append('serving_size', payload.servingSize);
      if (payload.ingredientsText) formData.append('ingredients_text', payload.ingredientsText);

      const n = payload.nutrition;
      formData.append('nutrition_data_per', '100g');
      if (n.energyKcal != null) {
        formData.append('nutriment_energy-kcal', String(n.energyKcal));
        formData.append('nutriment_energy-kcal_unit', 'kcal');
      }
      if (n.carbohydratesG != null) {
        formData.append('nutriment_carbohydrates', String(n.carbohydratesG));
        formData.append('nutriment_carbohydrates_unit', 'g');
      }
      if (n.sugarsG != null) {
        formData.append('nutriment_sugars', String(n.sugarsG));
        formData.append('nutriment_sugars_unit', 'g');
      }
      if (n.addedSugarsG != null) {
        formData.append('nutriment_added-sugars', String(n.addedSugarsG));
        formData.append('nutriment_added-sugars_unit', 'g');
      }
      if (n.proteinG != null) {
        formData.append('nutriment_proteins', String(n.proteinG));
        formData.append('nutriment_proteins_unit', 'g');
      }
      if (n.fatG != null) {
        formData.append('nutriment_fat', String(n.fatG));
        formData.append('nutriment_fat_unit', 'g');
      }
      if (n.saturatedFatG != null) {
        formData.append('nutriment_saturated-fat', String(n.saturatedFatG));
        formData.append('nutriment_saturated-fat_unit', 'g');
      }
      if (n.transFatG != null) {
        formData.append('nutriment_trans-fat', String(n.transFatG));
        formData.append('nutriment_trans-fat_unit', 'g');
      }
      if (n.fibreG != null) {
        formData.append('nutriment_fiber', String(n.fibreG));
        formData.append('nutriment_fiber_unit', 'g');
      }
      if (n.sodiumMg != null) {
        formData.append('nutriment_sodium', String(n.sodiumMg / 1000));
        formData.append('nutriment_sodium_unit', 'g');
      }
      if (n.saltG != null) {
        formData.append('nutriment_salt', String(n.saltG));
        formData.append('nutriment_salt_unit', 'g');
      }

      formData.append('comment', 'Contributed via AI Health Scanner India Mobile App');

      // Send metadata asynchronously
      const metaRes = await fetch(this.WRITE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'HealthScannerApp/1.0 (contact@healthscanner.app)',
        },
        body: formData.toString(),
      });

      if (metaRes.ok) {
        try {
          const metaJson = await metaRes.json() as any;
          if (metaJson.status === 1) {
            console.log('OpenFoodFacts submission accepted:', metaJson.status_verbose || 'Saved');
          } else {
            console.warn('OpenFoodFacts submission rejected:', metaJson.status_verbose || 'Failed');
          }
        } catch {
          console.warn('OpenFoodFacts returned non-JSON response');
        }
      } else {
        console.warn('OpenFoodFacts metadata post HTTP warning:', metaRes.status);
      }

      // 2. Upload images if available
      if (payload.imagesBase64 && payload.imagesBase64.length > 0) {
        for (let i = 0; i < payload.imagesBase64.length; i++) {
          const imgBase64 = payload.imagesBase64[i];
          if (!imgBase64) continue;

          const imgForm = new FormData();
          imgForm.append('code', barcode);
          if (offUser && offPass) {
            imgForm.append('user_id', offUser);
            imgForm.append('password', offPass);
          }
          imgForm.append('imagefield', i === 0 ? 'front_en' : i === 1 ? 'nutrition_en' : 'ingredients_en');
          imgForm.append(`imgupload_${i === 0 ? 'front' : i === 1 ? 'nutrition' : 'ingredients'}`, {
            uri: `data:image/jpeg;base64,${imgBase64}`,
            name: `label_${i}.jpg`,
            type: 'image/jpeg',
          } as any);

          fetch(this.IMAGE_API_URL, {
            method: 'POST',
            headers: {
              'User-Agent': 'HealthScannerApp/1.0 (contact@healthscanner.app)',
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
