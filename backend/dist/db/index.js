"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const seed_data_1 = require("../seed/seed-data");
class InMemoryDb {
    data = {
        users: [],
        user_profiles: [],
        user_health_conditions: [],
        user_restrictions: [],
        user_medications: [],
        products: [],
        scan_results: [],
        saved_products: [],
    };
    filePath;
    constructor() {
        this.filePath = path_1.default.resolve(__dirname, '../../health_scanner.db.json');
        this.load();
    }
    load() {
        try {
            if (fs_1.default.existsSync(this.filePath)) {
                const raw = fs_1.default.readFileSync(this.filePath, 'utf-8');
                this.data = JSON.parse(raw);
            }
        }
        catch (err) {
            console.warn('Could not load database file, starting fresh', err);
        }
        // Seed sample products if empty
        if (this.data.products.length === 0) {
            for (const p of seed_data_1.SEED_PRODUCTS) {
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
            fs_1.default.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Failed to save database file', err);
        }
    }
    get tables() {
        return this.data;
    }
}
let dbInstance = null;
function getDb() {
    if (!dbInstance) {
        dbInstance = new InMemoryDb();
    }
    return dbInstance;
}
