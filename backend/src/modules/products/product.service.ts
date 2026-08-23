import { IProductProvider } from './product.provider';
import { InternalProductProvider } from './internal-product.provider';
import { Product, AllergenRestrictionCode } from '@health-scanner/shared';

export class ProductService {
  private internalProvider: InternalProductProvider;

  constructor() {
    this.internalProvider = new InternalProductProvider();
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    // 1. Check Internal Database
    const internalProduct = await this.internalProvider.findByBarcode(barcode);
    if (internalProduct) {
      return internalProduct;
    }

    // 2. Fallback to OpenFoodFacts (with error handling and timeout)
    try {
      const offProduct = await this.fetchFromOpenFoodFacts(barcode);
      if (offProduct) {
        return offProduct;
      }
    } catch (err) {
      // Network or API failure, gracefully return null so UI triggers OCR fallback
    }

    return null;
  }

  async getProductById(id: string): Promise<Product | null> {
    if (id.startsWith('off-')) {
      const barcode = id.replace('off-', '');
      return this.getProductByBarcode(barcode);
    }
    const internal = await this.internalProvider.findById(id);
    if (internal) return internal;
    return this.getProductByBarcode(id);
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.internalProvider.searchByName(query);
  }

  private async fetchFromOpenFoodFacts(barcode: string): Promise<Product | null> {
    const cleanBarcode = barcode.trim();
    // Try India cluster first for faster regional response, then World cluster
    const endpoints = [
      `https://in.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
      `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
    ];

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'AIFoodScanner-Kerala-MVP/1.0 (contact@healthscanner.local)' },
          signal: AbortSignal.timeout(8000),
        });

        if (response.ok) {
          const data = await response.json() as any;
          if (data.status === 1 && data.product) {
            return this.mapOpenFoodFactsProduct(data.product, cleanBarcode);
          }
        }
      } catch {
        // Try next cluster endpoint
      }
    }
    return null;
  }

  private mapOpenFoodFactsProduct(p: any, barcode: string): Product {
    const nutriments = p.nutriments || {};

    const detectedAllergens: AllergenRestrictionCode[] = [];
    const allergensTags = p.allergens_tags || [];
    for (const tag of allergensTags) {
      const lower = tag.toLowerCase();
      if (lower.includes('milk')) detectedAllergens.push('milk');
      if (lower.includes('gluten') || lower.includes('wheat')) detectedAllergens.push('wheat_gluten');
      if (lower.includes('peanut')) detectedAllergens.push('peanut');
      if (lower.includes('nut')) detectedAllergens.push('tree_nuts');
      if (lower.includes('soy')) detectedAllergens.push('soy');
      if (lower.includes('egg')) detectedAllergens.push('egg');
    }

    const ingredientsList = (p.ingredients_text_en || p.ingredients_text || '')
      .split(/[,;\n]/)
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean);

    return {
      id: `off-${p.code || barcode}`,
      barcode: p.code || barcode,
      name: p.product_name || p.product_name_en || 'Unknown Product',
      brand: p.brands || 'Unknown Brand',
      category: p.categories?.split(',')[0]?.trim() || 'Packaged Food',
      servingSize: p.serving_size || undefined,
      imageUrl: p.image_url || p.image_front_url || undefined,
      nutritionPer100g: {
        energyKcal: nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? null,
        carbohydratesG: nutriments['carbohydrates_100g'] ?? null,
        sugarsG: nutriments['sugars_100g'] ?? null,
        addedSugarsG: nutriments['added-sugars_100g'] ?? null,
        proteinG: nutriments['proteins_100g'] ?? null,
        fatG: nutriments['fat_100g'] ?? null,
        saturatedFatG: nutriments['saturated-fat_100g'] ?? null,
        transFatG: nutriments['trans-fat_100g'] ?? null,
        fibreG: nutriments['fiber_100g'] ?? null,
        sodiumMg: nutriments['sodium_100g'] ? nutriments['sodium_100g'] * 1000 : null,
        saltG: nutriments['salt_100g'] ?? null,
      },
      ingredientsText: p.ingredients_text_en || p.ingredients_text || undefined,
      ingredientsList,
      detectedAllergens: Array.from(new Set(detectedAllergens)),
      source: 'openfoodfacts',
      sourceConfidence: 0.85,
    };
  }
}
