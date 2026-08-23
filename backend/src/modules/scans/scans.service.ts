import { randomUUID } from 'crypto';
import { getDb } from '../../db';
import { UserService } from '../user/user.service';
import { ProductService } from '../products/product.service';
import { evaluateFoodForUser } from '../rule-engine/evaluator';
import {
  NutritionValues,
  Product,
  ScanRecord,
  RuleEvaluationResult,
  AllergenRestrictionCode,
} from '@health-scanner/shared';

export interface EvaluateProductRequest {
  productId?: string;
  barcode?: string;
  customProduct?: {
    name: string;
    brand?: string;
    nutrition: NutritionValues;
    ingredientsList: string[];
    detectedAllergens?: AllergenRestrictionCode[];
  };
  scanType?: 'barcode' | 'ocr_label';
}

export class ScansService {
  private db = getDb();
  private userService = new UserService();
  private productService = new ProductService();

  async evaluateAndRecordScan(userId: string, input: EvaluateProductRequest) {
    const userProfile = this.userService.getProfile(userId);

    let product: Product | null = null;
    let productName = 'Unknown Product';
    let brand: string | undefined;
    let nutrition: NutritionValues = {};
    let ingredientsList: string[] = [];
    let detectedAllergens: AllergenRestrictionCode[] = [];
    let scanType: 'barcode' | 'ocr_label' = input.scanType || 'barcode';

    if (input.productId) {
      product = await this.productService.getProductById(input.productId);
    }
    if (!product && input.barcode) {
      product = await this.productService.getProductByBarcode(input.barcode);
    }

    if (product) {
      productName = product.name;
      brand = product.brand;
      nutrition = product.nutritionPer100g;
      ingredientsList = product.ingredientsList;
      detectedAllergens = product.detectedAllergens;
    } else if (input.customProduct) {
      productName = input.customProduct.name;
      brand = input.customProduct.brand;
      nutrition = input.customProduct.nutrition;
      ingredientsList = input.customProduct.ingredientsList;
      detectedAllergens = input.customProduct.detectedAllergens || [];
      scanType = 'ocr_label';
    } else {
      throw new Error('Please provide either a valid product identifier or extracted nutrition data.');
    }

    // Run deterministic rule evaluation
    const evaluation: RuleEvaluationResult = evaluateFoodForUser({
      userProfile,
      productNutrition: nutrition,
      ingredientsList,
      detectedAllergens,
    });

    const scanId = randomUUID();
    const now = new Date().toISOString();

    this.db.tables.scan_results.push({
      id: scanId,
      user_id: userId,
      product_id: product ? product.id : null,
      product_name: productName,
      brand: brand || null,
      scan_type: scanType,
      assessment_status: evaluation.status,
      score: evaluation.score,
      reasons_json: JSON.stringify(evaluation.reasons),
      allergen_warnings_json: JSON.stringify(evaluation.allergenWarnings),
      nutrition_snapshot_json: JSON.stringify(nutrition),
      ai_explanation_en: evaluation.overallSummaryEn,
      ai_explanation_ml: evaluation.overallSummaryMl,
      created_at: now,
    });

    this.db.save();

    return {
      scanId,
      product: {
        id: product ? product.id : scanId,
        name: productName,
        brand,
        servingSize: product?.servingSize,
        imageUrl: product?.imageUrl,
        nutrition,
        ingredientsList,
      },
      assessment: {
        status: evaluation.status,
        score: evaluation.score,
        summaryEn: evaluation.overallSummaryEn,
        summaryMl: evaluation.overallSummaryMl,
      },
      reasons: evaluation.reasons,
      allergenWarnings: evaluation.allergenWarnings,
      isMissingNutritionData: evaluation.isMissingNutritionData,
      missingFields: evaluation.missingFields,
      createdAt: now,
    };
  }

  getScanHistory(userId: string, limit: number = 20): ScanRecord[] {
    const rows = this.db.tables.scan_results
      .filter((s) => s.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      productId: r.product_id || '',
      productName: r.product_name,
      brand: r.brand || undefined,
      scanType: r.scan_type as 'barcode' | 'ocr_label',
      assessmentStatus: r.assessment_status as any,
      score: r.score,
      reasons: JSON.parse(r.reasons_json || '[]'),
      allergenWarnings: JSON.parse(r.allergen_warnings_json || '[]'),
      nutritionSnapshot: JSON.parse(r.nutrition_snapshot_json || '{}'),
      aiExplanationEn: r.ai_explanation_en || undefined,
      aiExplanationMl: r.ai_explanation_ml || undefined,
      createdAt: r.created_at,
    }));
  }

  clearScanHistory(userId: string) {
    const initialCount = this.db.tables.scan_results.filter((s) => s.user_id === userId).length;
    this.db.tables.scan_results = this.db.tables.scan_results.filter((s) => s.user_id !== userId);
    this.db.save();
    return { success: true, count: initialCount };
  }

  getScanById(userId: string, scanId: string) {
    const row = this.db.tables.scan_results.find((s) => s.id === scanId && s.user_id === userId);

    if (!row) {
      throw new Error('Scan record not found.');
    }

    return {
      id: row.id,
      userId: row.user_id,
      productId: row.product_id || '',
      productName: row.product_name,
      brand: row.brand || undefined,
      scanType: row.scan_type as 'barcode' | 'ocr_label',
      assessmentStatus: row.assessment_status as any,
      score: row.score,
      reasons: JSON.parse(row.reasons_json || '[]'),
      allergenWarnings: JSON.parse(row.allergen_warnings_json || '[]'),
      nutritionSnapshot: JSON.parse(row.nutrition_snapshot_json || '{}'),
      aiExplanationEn: row.ai_explanation_en || undefined,
      aiExplanationMl: row.ai_explanation_ml || undefined,
      createdAt: row.created_at,
    };
  }

  // Saved / Favourites
  toggleSavedProduct(userId: string, productId: string) {
    const idx = this.db.tables.saved_products.findIndex((sp) => sp.user_id === userId && sp.product_id === productId);

    if (idx >= 0) {
      this.db.tables.saved_products.splice(idx, 1);
      this.db.save();
      return { isSaved: false };
    } else {
      this.db.tables.saved_products.push({
        id: randomUUID(),
        user_id: userId,
        product_id: productId,
        created_at: new Date().toISOString(),
      });
      this.db.save();
      return { isSaved: true };
    }
  }

  getSavedProducts(userId: string) {
    const saved = this.db.tables.saved_products.filter((sp) => sp.user_id === userId);
    return saved.map((sp) => {
      const p = this.db.tables.products.find((prod) => prod.id === sp.product_id);
      return {
        id: sp.product_id,
        barcode: p?.barcode || undefined,
        name: p?.name || 'Unknown Product',
        brand: p?.brand || undefined,
        category: p?.category || undefined,
        servingSize: p?.serving_size || undefined,
        imageUrl: p?.image_url || undefined,
        nutritionPer100g: p ? JSON.parse(p.nutrition_json) : {},
        ingredientsList: p ? JSON.parse(p.ingredients_list_json || '[]') : [],
        savedAt: sp.created_at,
      };
    });
  }
}
