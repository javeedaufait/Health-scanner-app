import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { SEED_PRODUCTS } from '../seed/seed-data';
import { Product } from '@health-scanner/shared';

export interface UserEntity {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfileEntity {
  id: string;
  user_id: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  country: string;
  state: string;
  language_preference: string;
  disclaimer_acknowledged: number;
  disclaimer_acknowledged_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserHealthConditionEntity {
  id: string;
  user_id: string;
  condition_code: string;
  created_at: string;
}

export interface UserRestrictionEntity {
  id: string;
  user_id: string;
  restriction_code?: string | null;
  custom_text?: string | null;
  created_at: string;
}

export interface UserMedicationEntity {
  id: string;
  user_id: string;
  medicine_name: string;
  dosage?: string | null;
  frequency?: string | null;
  created_at: string;
}

export interface ProductEntity {
  id: string;
  barcode?: string | null;
  name: string;
  brand?: string | null;
  category?: string | null;
  serving_size?: string | null;
  serving_size_unit?: string | null;
  image_url?: string | null;
  nutrition_json: string;
  ingredients_text?: string | null;
  ingredients_list_json: string;
  detected_allergens_json: string;
  source: string;
  source_confidence: number;
  created_at: string;
  updated_at: string;
}

export interface ScanResultEntity {
  id: string;
  user_id: string;
  product_id?: string | null;
  product_name: string;
  brand?: string | null;
  scan_type: string;
  assessment_status: string;
  score: number;
  reasons_json: string;
  allergen_warnings_json: string;
  nutrition_snapshot_json: string;
  ai_explanation_en?: string | null;
  ai_explanation_ml?: string | null;
  created_at: string;
}

export interface SavedProductEntity {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface DbSchema {
  users: UserEntity[];
  user_profiles: UserProfileEntity[];
  user_health_conditions: UserHealthConditionEntity[];
  user_restrictions: UserRestrictionEntity[];
  user_medications: UserMedicationEntity[];
  products: ProductEntity[];
  scan_results: ScanResultEntity[];
  saved_products: SavedProductEntity[];
}

class InMemoryDb {
  private data: DbSchema = {
    users: [],
    user_profiles: [],
    user_health_conditions: [],
    user_restrictions: [],
    user_medications: [],
    products: [],
    scan_results: [],
    saved_products: [],
  };

  private filePath: string;

  constructor() {
    this.filePath = path.resolve(__dirname, '../../health_scanner.db.json');
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Could not load database file, starting fresh', err);
    }

    // Seed sample products if empty
    if (this.data.products.length === 0) {
      for (const p of SEED_PRODUCTS) {
        this.data.products.push({
          id: p.id,
          barcode: p.barcode || null,
          name: p.name,
          brand: p.brand || null,
          category: p.category || null,
          serving_size: p.servingSize || null,
          serving_size_unit: p.servingSizeUnit || null,
          image_url: p.imageUrl || null,
          nutrition_json: JSON.stringify(p.nutritionPer100g),
          ingredients_text: p.ingredientsText || null,
          ingredients_list_json: JSON.stringify(p.ingredientsList || []),
          detected_allergens_json: JSON.stringify(p.detectedAllergens || []),
          source: p.source || 'internal',
          source_confidence: p.sourceConfidence || 1.0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file', err);
    }
  }

  get tables() {
    return this.data;
  }
}

let dbInstance: InMemoryDb | null = null;

export function getDb(): InMemoryDb {
  if (!dbInstance) {
    dbInstance = new InMemoryDb();
  }
  return dbInstance;
}
