import { IProductProvider } from './product.provider';
import { Product } from '@health-scanner/shared';
import { getDb } from '../../db';

export class InternalProductProvider implements IProductProvider {
  name = 'internal';
  private db = getDb();

  async findByBarcode(barcode: string): Promise<Product | null> {
    const row = this.db.tables.products.find((p) => p.barcode === barcode);
    if (!row) return null;
    return this.mapRowToProduct(row);
  }

  async findById(id: string): Promise<Product | null> {
    const row = this.db.tables.products.find((p) => p.id === id);
    if (!row) return null;
    return this.mapRowToProduct(row);
  }

  async searchByName(query: string, limit: number = 20): Promise<Product[]> {
    const qLower = query.toLowerCase();
    const rows = this.db.tables.products.filter((p) =>
      p.name.toLowerCase().includes(qLower) || (p.brand && p.brand.toLowerCase().includes(qLower))
    ).slice(0, limit);

    return rows.map((r) => this.mapRowToProduct(r));
  }

  private mapRowToProduct(row: any): Product {
    return {
      id: row.id,
      barcode: row.barcode || undefined,
      name: row.name,
      brand: row.brand || undefined,
      category: row.category || undefined,
      servingSize: row.serving_size || undefined,
      servingSizeUnit: row.serving_size_unit || undefined,
      imageUrl: row.image_url || undefined,
      nutritionPer100g: JSON.parse(row.nutrition_json),
      ingredientsText: row.ingredients_text || undefined,
      ingredientsList: JSON.parse(row.ingredients_list_json || '[]'),
      detectedAllergens: JSON.parse(row.detected_allergens_json || '[]'),
      source: row.source || 'internal',
      sourceConfidence: row.source_confidence || 1.0,
    };
  }
}
