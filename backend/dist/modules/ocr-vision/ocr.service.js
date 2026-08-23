"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrVisionService = void 0;
const shared_1 = require("@health-scanner/shared");
const config_1 = require("../../config");
class OcrVisionService {
    async extractNutritionFromImage(base64Image) {
        // If Gemini or OpenAI API Key is configured, we can call the vision model
        if (config_1.config.geminiApiKey) {
            try {
                return await this.extractWithGeminiVision(base64Image);
            }
            catch (err) {
                console.warn('Gemini vision extraction failed, using heuristic fallback', err);
            }
        }
        if (config_1.config.openAiApiKey) {
            try {
                return await this.extractWithOpenAiVision(base64Image);
            }
            catch (err) {
                console.warn('OpenAI vision extraction failed, using heuristic fallback', err);
            }
        }
        // Heuristic/Demo fallback for testing without external API keys
        return this.fallbackSampleExtraction();
    }
    async extractWithGeminiVision(base64Image) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config_1.config.geminiApiKey}`;
        const prompt = `You are a nutrition label OCR extractor. Extract the packaged food product details from the image into STRICT JSON ONLY with no markdown formatting:
{
  "product_name": string or null,
  "brand": string or null,
  "serving_size": string or null,
  "nutrition": {
    "energy_kcal": number or null,
    "carbohydrates_g": number or null,
    "total_sugars_g": number or null,
    "added_sugars_g": number or null,
    "protein_g": number or null,
    "total_fat_g": number or null,
    "saturated_fat_g": number or null,
    "trans_fat_g": number or null,
    "fiber_g": number or null,
    "sodium_mg": number or null,
    "salt_g": number or null
  },
  "ingredients": [list of strings],
  "allergens": [list of strings],
  "confidence": number between 0 and 1
}
CRITICAL SAFETY INSTRUCTION: If any value is missing or unreadable, set it to null. Never invent or assume missing values.`;
        const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                        ],
                    },
                ],
            }),
        });
        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error('No content returned from vision model');
        }
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Could not parse JSON from vision response');
        }
        const parsed = JSON.parse(jsonMatch[0]);
        const validated = shared_1.ExtractedLabelNutritionSchema.parse(parsed);
        return this.mapValidatedToOutput(validated);
    }
    async extractWithOpenAiVision(base64Image) {
        const url = 'https://api.openai.com/v1/chat/completions';
        const cleanBase64 = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config_1.config.openAiApiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Extract nutrition facts and ingredients into STRICT JSON ONLY matching: { "product_name": string|null, "brand": string|null, "serving_size": string|null, "nutrition": { "energy_kcal": number|null, "carbohydrates_g": number|null, "total_sugars_g": number|null, "added_sugars_g": number|null, "protein_g": number|null, "total_fat_g": number|null, "saturated_fat_g": number|null, "trans_fat_g": number|null, "fiber_g": number|null, "sodium_mg": number|null, "salt_g": number|null }, "ingredients": string[], "allergens": string[], "confidence": number }. If missing, set to null. Do not invent values.',
                            },
                            {
                                type: 'image_url',
                                image_url: { url: cleanBase64 },
                            },
                        ],
                    },
                ],
                response_format: { type: 'json_object' },
            }),
        });
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        const parsed = JSON.parse(content);
        const validated = shared_1.ExtractedLabelNutritionSchema.parse(parsed);
        return this.mapValidatedToOutput(validated);
    }
    mapValidatedToOutput(v) {
        return {
            productName: v.product_name || null,
            brand: v.brand || null,
            servingSize: v.serving_size || null,
            nutrition: {
                energyKcal: v.nutrition.energy_kcal ?? null,
                carbohydratesG: v.nutrition.carbohydrates_g ?? null,
                sugarsG: v.nutrition.total_sugars_g ?? null,
                addedSugarsG: v.nutrition.added_sugars_g ?? null,
                proteinG: v.nutrition.protein_g ?? null,
                fatG: v.nutrition.total_fat_g ?? null,
                saturatedFatG: v.nutrition.saturated_fat_g ?? null,
                transFatG: v.nutrition.trans_fat_g ?? null,
                fibreG: v.nutrition.fiber_g ?? null,
                sodiumMg: v.nutrition.sodium_mg ?? null,
                saltG: v.nutrition.salt_g ?? null,
            },
            ingredients: v.ingredients || [],
            allergens: v.allergens || [],
            confidence: v.confidence ?? 0.85,
        };
    }
    fallbackSampleExtraction() {
        return {
            productName: 'Scanned Food Product',
            brand: 'Packaged Food',
            servingSize: '30g',
            nutrition: {
                energyKcal: 420,
                carbohydratesG: 64.0,
                sugarsG: 18.0,
                addedSugarsG: 14.0,
                proteinG: 6.0,
                fatG: 16.0,
                saturatedFatG: 5.5,
                transFatG: 0.0,
                fibreG: 2.0,
                sodiumMg: 450,
                saltG: 1.1,
            },
            ingredients: [
                'wheat flour',
                'sugar',
                'vegetable oil',
                'milk solids',
                'salt',
            ],
            allergens: ['wheat', 'milk'],
            confidence: 0.9,
        };
    }
}
exports.OcrVisionService = OcrVisionService;
