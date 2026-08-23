"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const internal_product_provider_1 = require("./internal-product.provider");
class ProductService {
    internalProvider;
    constructor() {
        this.internalProvider = new internal_product_provider_1.InternalProductProvider();
    }
    async getProductByBarcode(barcode) {
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
        }
        catch (err) {
            // Network or API failure, gracefully return null so UI triggers OCR fallback
        }
        return null;
    }
    async getProductById(id) {
        return this.internalProvider.findById(id);
    }
    async searchProducts(query) {
        return this.internalProvider.searchByName(query);
    }
    async fetchFromOpenFoodFacts(barcode) {
        const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'AIFoodScanner-Kerala-MVP/1.0' },
            signal: AbortSignal.timeout(3000),
        });
        if (!response.ok)
            return null;
        const data = await response.json();
        if (data.status !== 1 || !data.product)
            return null;
        const p = data.product;
        const nutriments = p.nutriments || {};
        const detectedAllergens = [];
        const allergensTags = p.allergens_tags || [];
        for (const tag of allergensTags) {
            const lower = tag.toLowerCase();
            if (lower.includes('milk'))
                detectedAllergens.push('milk');
            if (lower.includes('gluten') || lower.includes('wheat'))
                detectedAllergens.push('wheat_gluten');
            if (lower.includes('peanut'))
                detectedAllergens.push('peanut');
            if (lower.includes('nut'))
                detectedAllergens.push('tree_nuts');
            if (lower.includes('soy'))
                detectedAllergens.push('soy');
            if (lower.includes('egg'))
                detectedAllergens.push('egg');
        }
        const ingredientsList = (p.ingredients_text_en || p.ingredients_text || '')
            .split(/[,;\n]/)
            .map((s) => s.trim().toLowerCase())
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
exports.ProductService = ProductService;
