"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScansService = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../../db");
const user_service_1 = require("../user/user.service");
const product_service_1 = require("../products/product.service");
const evaluator_1 = require("../rule-engine/evaluator");
class ScansService {
    db = (0, db_1.getDb)();
    userService = new user_service_1.UserService();
    productService = new product_service_1.ProductService();
    async evaluateAndRecordScan(userId, input) {
        const userProfile = this.userService.getProfile(userId);
        let product = null;
        let productName = 'Unknown Product';
        let brand;
        let nutrition = {};
        let ingredientsList = [];
        let detectedAllergens = [];
        let scanType = input.scanType || 'barcode';
        if (input.productId) {
            product = await this.productService.getProductById(input.productId);
        }
        else if (input.barcode) {
            product = await this.productService.getProductByBarcode(input.barcode);
        }
        if (product) {
            productName = product.name;
            brand = product.brand;
            nutrition = product.nutritionPer100g;
            ingredientsList = product.ingredientsList;
            detectedAllergens = product.detectedAllergens;
        }
        else if (input.customProduct) {
            productName = input.customProduct.name;
            brand = input.customProduct.brand;
            nutrition = input.customProduct.nutrition;
            ingredientsList = input.customProduct.ingredientsList;
            detectedAllergens = input.customProduct.detectedAllergens || [];
            scanType = 'ocr_label';
        }
        else {
            throw new Error('Please provide either a valid product identifier or extracted nutrition data.');
        }
        // Run deterministic rule evaluation
        const evaluation = (0, evaluator_1.evaluateFoodForUser)({
            userProfile,
            productNutrition: nutrition,
            ingredientsList,
            detectedAllergens,
        });
        const scanId = (0, crypto_1.randomUUID)();
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
    getScanHistory(userId, limit = 20) {
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
            scanType: r.scan_type,
            assessmentStatus: r.assessment_status,
            score: r.score,
            reasons: JSON.parse(r.reasons_json || '[]'),
            allergenWarnings: JSON.parse(r.allergen_warnings_json || '[]'),
            nutritionSnapshot: JSON.parse(r.nutrition_snapshot_json || '{}'),
            aiExplanationEn: r.ai_explanation_en || undefined,
            aiExplanationMl: r.ai_explanation_ml || undefined,
            createdAt: r.created_at,
        }));
    }
    getScanById(userId, scanId) {
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
            scanType: row.scan_type,
            assessmentStatus: row.assessment_status,
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
    toggleSavedProduct(userId, productId) {
        const idx = this.db.tables.saved_products.findIndex((sp) => sp.user_id === userId && sp.product_id === productId);
        if (idx >= 0) {
            this.db.tables.saved_products.splice(idx, 1);
            this.db.save();
            return { isSaved: false };
        }
        else {
            this.db.tables.saved_products.push({
                id: (0, crypto_1.randomUUID)(),
                user_id: userId,
                product_id: productId,
                created_at: new Date().toISOString(),
            });
            this.db.save();
            return { isSaved: true };
        }
    }
    getSavedProducts(userId) {
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
exports.ScansService = ScansService;
