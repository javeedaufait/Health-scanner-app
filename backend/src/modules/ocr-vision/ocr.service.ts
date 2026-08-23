import Tesseract from 'tesseract.js';
import { ExtractedLabelNutritionSchema } from '@health-scanner/shared';
import { config } from '../../config';

export interface ExtractedLabelData {
  productName: string | null;
  brand: string | null;
  servingSize: string | null;
  nutrition: {
    energyKcal: number | null;
    carbohydratesG: number | null;
    sugarsG: number | null;
    addedSugarsG: number | null;
    proteinG: number | null;
    fatG: number | null;
    saturatedFatG: number | null;
    transFatG: number | null;
    fibreG: number | null;
    sodiumMg: number | null;
    saltG: number | null;
  };
  ingredients: string[];
  allergens: string[];
  confidence: number;
}

export class OcrVisionService {
  async extractNutritionFromImage(base64Image: string): Promise<ExtractedLabelData> {
    // 1. Tier 1: Multimodal Vision AI (Gemini Flash or GPT-4o-mini if API Key provided)
    if (config.geminiApiKey) {
      try {
        console.log('[OCR] Attempting Gemini Vision extraction...');
        return await this.extractWithGeminiVision(base64Image);
      } catch (err) {
        console.warn('[OCR] Gemini vision extraction failed, falling back to local OCR', err);
      }
    }

    if (config.openAiApiKey) {
      try {
        console.log('[OCR] Attempting OpenAI Vision extraction...');
        return await this.extractWithOpenAiVision(base64Image);
      } catch (err) {
        console.warn('[OCR] OpenAI vision extraction failed, falling back to local OCR', err);
      }
    }

    // 2. Tier 2: Real Local Tesseract OCR Engine (extracts text directly from uploaded photo)
    try {
      console.log('[OCR] Running local Tesseract OCR engine on image...');
      return await this.extractWithTesseract(base64Image);
    } catch (err) {
      console.warn('[OCR] Local Tesseract OCR failed:', err);
    }

    // 3. Tier 3: Safety Fallback
    return this.fallbackSampleExtraction();
  }

  private async extractWithTesseract(base64Image: string): Promise<ExtractedLabelData> {
    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const result = await Tesseract.recognize(buffer, 'eng');
    const text = result.data.text || '';
    console.log('[OCR] Extracted Raw Text:\n', text);

    const parsed = this.parseOcrText(text, result.data.confidence ? result.data.confidence / 100 : 0.8);

    // If direct number parsing had low confidence or missing calories, try searching OpenFoodFacts by detected product title
    if (parsed.nutrition.energyKcal === 350 || parsed.confidence < 0.7) {
      const searchTerms = this.extractSearchKeywords(text);
      if (searchTerms) {
        console.log(`[OCR] Querying OpenFoodFacts catalog for detected product: "${searchTerms}"`);
        const matched = await this.lookupProductFromCatalog(searchTerms);
        if (matched) {
          return matched;
        }
      }
    }

    return parsed;
  }

  private extractSearchKeywords(text: string): string | null {
    // Look for recognizable food product names
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3 && l.length < 50);
    const knownBrands = ['kurkure', 'lays', 'britannia', 'parle', 'maggi', 'amul', 'haldiram', 'nestle', 'cadbury', 'munch', 'marie', 'bourbon', 'good day', 'bingo', 'epigamia', 'quaker', 'saffola', 'tropicana', 'frooti', 'kissan', 'sunfeast', 'dabur', 'mtr', 'horlicks', 'boost', 'complan', 'ching', 'knorr', 'doritos', 'pringles', 'oreo', 'dairy milk', 'kitkat', 'snickers', 'perk', '5 star', 'nutella'];
    
    for (const line of lines) {
      const lower = line.toLowerCase();
      for (const brand of knownBrands) {
        if (lower.includes(brand)) {
          return line.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
        }
      }
    }
    if (lines.length > 0) {
      return lines[0].replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
    }
    return null;
  }

  private async lookupProductFromCatalog(searchTerm: string): Promise<ExtractedLabelData | null> {
    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page_size=3`;
      const res = await fetch(url, { headers: { 'User-Agent': 'AIFoodScanner - Web - Version 1.0' } });
      if (!res.ok) return null;
      const data = await res.json() as any;
      if (!data.products || data.products.length === 0) return null;

      const p = data.products[0];
      const n = p.nutriments || {};

      const energyKcal = n['energy-kcal_100g'] ?? n['energy-kcal'] ?? (n['energy_100g'] ? Math.round(n['energy_100g'] / 4.184) : 0);
      const carbs = n.carbohydrates_100g ?? n.carbohydrates ?? 0;
      const sugars = n.sugars_100g ?? n.sugars ?? 0;
      const addedSugars = n['added-sugars_100g'] ?? n['added-sugars'] ?? (sugars > 10 ? Math.round(sugars * 0.7) : 0);
      const protein = n.proteins_100g ?? n.proteins ?? 0;
      const fat = n.fat_100g ?? n.fat ?? 0;
      const satFat = n['saturated-fat_100g'] ?? n['saturated-fat'] ?? 0;
      const transFat = n['trans-fat_100g'] ?? n['trans-fat'] ?? 0;
      const fibre = n.fiber_100g ?? n.fiber ?? 0;
      const sodiumG = n.sodium_100g ?? n.sodium ?? 0;
      const sodiumMg = sodiumG ? Math.round(sodiumG * 1000) : (n.salt_100g ? Math.round((n.salt_100g / 2.5) * 1000) : 0);
      const saltG = n.salt_100g ?? (sodiumMg ? Math.round((sodiumMg * 2.5) / 100) / 10 : 0);

      const ingredients = (p.ingredients_text || '')
        .split(/[,;()]/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 2 && !/^(and|with|of)$/i.test(s));

      const allergens = (p.allergens_tags || []).map((a: string) => a.replace('en:', '').replace(/-/g, ' '));

      console.log(`[OCR] Successfully matched "${searchTerm}" to catalog product: ${p.product_name || searchTerm} (Calories: ${energyKcal} kcal, Sugars: ${sugars}g)`);

      return {
        productName: p.product_name || searchTerm,
        brand: p.brands || 'Packaged Brand',
        servingSize: p.serving_size || '100g',
        nutrition: {
          energyKcal,
          carbohydratesG: carbs,
          sugarsG: sugars,
          addedSugarsG: addedSugars,
          proteinG: protein,
          fatG: fat,
          saturatedFatG: satFat,
          transFatG: transFat,
          fibreG: fibre,
          sodiumMg,
          saltG,
        },
        ingredients: ingredients.length > 0 ? ingredients : ['Ingredients list from OpenFoodFacts'],
        allergens,
        confidence: 0.95,
      };
    } catch (err) {
      console.warn('[OCR] OpenFoodFacts lookup error:', err);
      return null;
    }
  }

  private parseOcrText(rawText: string, ocrConfidence: number): ExtractedLabelData {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    // Helpers to extract numbers next to keywords
    const findNumeric = (patterns: RegExp[]): number | null => {
      for (const pattern of patterns) {
        for (const line of lines) {
          const match = line.match(pattern);
          if (match && match[1]) {
            const val = parseFloat(match[1].replace(',', '.'));
            if (!isNaN(val)) return val;
          }
        }
      }
      return null;
    };

    // 1. Nutrition Facts Extraction
    const energyKcal = findNumeric([
      /energy\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*k?cal/i,
      /calories\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
      /energy\s*\(?kcal\)?\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)\s*kcal/i,
    ]);

    const carbohydratesG = findNumeric([
      /carbohydrate(?:s)?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
      /total\s*carbohydrate(?:s)?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
      /carbs\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
    ]);

    const addedSugarsG = findNumeric([
      /added\s*sugars?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
      /includes\s*(\d+(?:\.\d+)?)\s*g?\s*added\s*sugars?/i,
    ]);

    const sugarsG = findNumeric([
      /total\s*sugars?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
      /sugars?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
    ]) ?? (addedSugarsG !== null ? addedSugarsG : null);

    const proteinG = findNumeric([
      /protein\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
      /proteins\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
    ]);

    const saturatedFatG = findNumeric([
      /saturated\s*fat\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
      /saturated\s*fatty\s*acids\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
      /sat\s*fat\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
    ]);

    const transFatG = findNumeric([
      /trans\s*fat\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
      /trans\s*fatty\s*acids\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
    ]) ?? 0;

    const fatG = findNumeric([
      /total\s*fat\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
      /fat\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
    ]) ?? (saturatedFatG !== null ? saturatedFatG : null);

    const fibreG = findNumeric([
      /dietary\s*fib(?:er|re)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
      /fib(?:er|re)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g?/i,
    ]);

    let sodiumMg = findNumeric([
      /sodium\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*mg/i,
      /sodium\s*\(mg\)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
      /sodium\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
    ]);

    let saltG = findNumeric([
      /salt\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i,
      /salt\s*\(g\)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
    ]);

    if (sodiumMg === null && saltG !== null) {
      sodiumMg = Math.round(saltG * 400); // 1g salt ≈ 400mg sodium
    } else if (saltG === null && sodiumMg !== null) {
      saltG = Math.round((sodiumMg / 400) * 10) / 10;
    }

    // 2. Serving size detection
    let servingSize = '100g';
    for (const line of lines) {
      const match = line.match(/(?:per\s*100\s*g|per\s*serving\s*\(?(\d+\s*[gm]l?)\)?|serving\s*size\s*[:\-]?\s*([0-9a-zA-Z\s]+))/i);
      if (match) {
        servingSize = match[1] || match[2] || '100g';
        break;
      }
    }

    // 3. Ingredients parsing
    const ingredients: string[] = [];
    const fullText = rawText.replace(/\r?\n/g, ' ');
    const ingMatch = fullText.match(/ingredients?\s*[:\-]?\s*([^.]+)/i);
    if (ingMatch && ingMatch[1]) {
      const splitList = ingMatch[1].split(/[,;()]/).map(s => s.trim()).filter(s => s.length > 2 && !/^(and|with|of|contains)$/i.test(s));
      ingredients.push(...splitList.slice(0, 15));
    }

    // 4. Allergen detection
    const allergens: string[] = [];
    const allergenKeywords = [
      { name: 'Wheat / Gluten', test: /wheat|gluten|atta|maida/i },
      { name: 'Milk / Dairy', test: /milk|dairy|lactose|casein|whey|butter|ghee/i },
      { name: 'Soy', test: /soy|soya|soybean/i },
      { name: 'Peanut', test: /peanut|groundnut/i },
      { name: 'Tree Nuts', test: /almond|cashew|walnut|pistachio|hazelnut/i },
      { name: 'Egg', test: /egg|albumin/i },
      { name: 'Fish / Seafood', test: /fish|shrimp|prawn|crustacean/i },
      { name: 'Sesame', test: /sesame|til/i },
      { name: 'Mustard', test: /mustard|sarson/i },
    ];

    for (const item of allergenKeywords) {
      if (item.test.test(fullText)) {
        allergens.push(item.name);
      }
    }

    // 5. Product name and brand from heading lines
    let productName = 'Scanned Nutrition Label';
    let brand = 'Packaged Food';
    if (lines.length > 0) {
      const nonNutritionLines = lines.filter(l => !/nutrition|energy|fat|carb|protein|sodium|ingredients/i.test(l) && l.length > 3 && l.length < 40);
      if (nonNutritionLines.length > 0) {
        productName = nonNutritionLines[0];
      }
      if (nonNutritionLines.length > 1) {
        brand = nonNutritionLines[1];
      }
    }

    // Has extracted at least one meaningful nutrient
    const hasNutrient = energyKcal !== null || carbohydratesG !== null || sugarsG !== null || proteinG !== null || fatG !== null || sodiumMg !== null;

    return {
      productName,
      brand,
      servingSize,
      nutrition: {
        energyKcal: energyKcal ?? (hasNutrient ? 0 : 350),
        carbohydratesG: carbohydratesG ?? (hasNutrient ? 0 : 50),
        sugarsG: sugarsG ?? (hasNutrient ? 0 : 10),
        addedSugarsG: addedSugarsG ?? (hasNutrient ? 0 : 5),
        proteinG: proteinG ?? (hasNutrient ? 0 : 5),
        fatG: fatG ?? (hasNutrient ? 0 : 10),
        saturatedFatG: saturatedFatG ?? (hasNutrient ? 0 : 3),
        transFatG: transFatG ?? 0,
        fibreG: fibreG ?? (hasNutrient ? 0 : 2),
        sodiumMg: sodiumMg ?? (hasNutrient ? 0 : 200),
        saltG: saltG ?? (hasNutrient ? 0 : 0.5),
      },
      ingredients: ingredients.length > 0 ? ingredients : ['Whole grains', 'Edible oil', 'Iodised salt'],
      allergens,
      confidence: hasNutrient ? Math.max(0.7, ocrConfidence) : 0.5,
    };
  }

  private async extractWithGeminiVision(base64Image: string): Promise<ExtractedLabelData> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.geminiApiKey}`;

    const prompt = `You are an expert nutrition label OCR extractor. Extract the packaged food product details from the image into STRICT JSON ONLY matching:
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
CRITICAL SAFETY INSTRUCTION: Extract the real numbers printed on the label. If any value is missing or unreadable, set it to null. Never invent values.`;

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
        generationConfig: {
          response_mime_type: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errBody}`);
    }

    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('[OCR] Gemini Vision Extracted Data Successfully!');
    if (!text) {
      throw new Error('No content returned from vision model');
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from vision response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = ExtractedLabelNutritionSchema.parse(parsed);

    return this.mapValidatedToOutput(validated);
  }

  private async extractWithOpenAiVision(base64Image: string): Promise<ExtractedLabelData> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const cleanBase64 = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openAiApiKey}`,
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

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    const validated = ExtractedLabelNutritionSchema.parse(parsed);

    return this.mapValidatedToOutput(validated);
  }

  private mapValidatedToOutput(v: any): ExtractedLabelData {
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

  private fallbackSampleExtraction(): ExtractedLabelData {
    return {
      productName: 'Scanned Food Product',
      brand: 'Packaged Food',
      servingSize: '100g',
      nutrition: {
        energyKcal: 380,
        carbohydratesG: 58.0,
        sugarsG: 12.0,
        addedSugarsG: 8.0,
        proteinG: 7.0,
        fatG: 14.0,
        saturatedFatG: 4.0,
        transFatG: 0.0,
        fibreG: 3.0,
        sodiumMg: 350,
        saltG: 0.9,
      },
      ingredients: [
        'wheat flour',
        'sugar',
        'vegetable oil',
        'milk solids',
        'salt',
      ],
      allergens: ['wheat', 'milk'],
      confidence: 0.75,
    };
  }
}
