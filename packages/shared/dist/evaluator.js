"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateFoodForUser = evaluateFoodForUser;
const constants_1 = require("./constants");
const allergen_detector_1 = require("./allergen-detector");
function evaluateFoodForUser(input) {
    const { userProfile, productNutrition, ingredientsList = [], ingredientsText = '', detectedAllergens = [], customRules = constants_1.DEFAULT_HEURISTIC_RULES, } = input;
    const userConditions = userProfile.conditions || ['none'];
    const reasons = [];
    const missingFields = [];
    // Check missing nutrition fields (null or undefined)
    const keyFields = [
        'energyKcal',
        'carbohydratesG',
        'sugarsG',
        'addedSugarsG',
        'proteinG',
        'fatG',
        'saturatedFatG',
        'transFatG',
        'sodiumMg',
    ];
    for (const field of keyFields) {
        if (productNutrition[field] === null || productNutrition[field] === undefined) {
            missingFields.push(field);
        }
    }
    // =========================================================================
    // PATH 1: ALLERGEN & BIOLOGICAL SAFETY ENGINE (Independent Safety Warnings)
    // =========================================================================
    const allergenResult = (0, allergen_detector_1.detectAllergensInIngredients)({
        userProfile,
        ingredientsList,
        ingredientsText,
        detectedAllergens,
    });
    const { hasAllergenHazard, allergenWarnings, precautionaryTraces } = allergenResult;
    // =========================================================================
    // PATH 2: NUTRIENT GUIDANCE ENGINE (Personalized Guidance Score 0–100)
    // =========================================================================
    let baseScore = 100;
    let kidneyAdvisoryEn;
    let kidneyAdvisoryMl;
    const activeRules = customRules.filter((r) => r.isActive);
    for (const condition of userConditions) {
        if (condition === 'none')
            continue;
        if (condition === 'kidney_disease') {
            kidneyAdvisoryEn = 'Kidney disease requires personalized clinical management. Please consult your nephrologist or renal dietitian for specialized dietary limits.';
            kidneyAdvisoryMl = 'വൃക്കരോഗമുള്ളവർ ഭക്ഷണ കാര്യങ്ങളിൽ ഡോക്ടറുടെയോ ഡയറ്റീഷ്യന്റെയോ വ്യക്തിഗത നിർദ്ദേശങ്ങൾ സ്വീകരിക്കേണ്ടതാണ്.';
            continue;
        }
        if (condition === 'other') {
            reasons.push({
                conditionCode: 'other',
                nutrient: 'general',
                severity: 'low',
                messageEn: 'Unlisted condition selected. Please review nutrient values with your physician.',
                messageMl: 'ലിസ്റ്റ് ചെയ്യാത്ത മറ്റ് ആരോഗ്യ പ്രൊഫൈലുകൾക്ക് ഡോക്ടറുടെ സേവനം തേടുക.',
            });
            continue;
        }
        const conditionRules = activeRules.filter((r) => r.conditionCode === condition);
        for (const rule of conditionRules) {
            let nutrientValue = productNutrition[rule.nutrient];
            if ((nutrientValue === null || nutrientValue === undefined) && rule.nutrient === 'addedSugarsG') {
                nutrientValue = productNutrition.sugarsG ?? null;
            }
            if (nutrientValue === null || nutrientValue === undefined) {
                // Skip missing nutrient values (treated as UNKNOWN, no false score penalty)
                continue;
            }
            let isTriggered = false;
            switch (rule.operator) {
                case '>':
                    isTriggered = nutrientValue > rule.threshold;
                    break;
                case '>=':
                    isTriggered = nutrientValue >= rule.threshold;
                    break;
                case '<':
                    isTriggered = nutrientValue < rule.threshold;
                    break;
                case '<=':
                    isTriggered = nutrientValue <= rule.threshold;
                    break;
            }
            if (isTriggered) {
                const existingIdx = reasons.findIndex((r) => r.conditionCode === condition && r.nutrient === rule.nutrient);
                if (existingIdx >= 0) {
                    const prevDeduction = reasons[existingIdx].deduction || 0;
                    if (rule.deduction > prevDeduction) {
                        baseScore -= (rule.deduction - prevDeduction);
                        reasons[existingIdx] = {
                            ruleId: rule.id,
                            conditionCode: rule.conditionCode,
                            nutrient: String(rule.nutrient),
                            threshold: rule.threshold,
                            unit: rule.unit,
                            classification: rule.classification,
                            source: rule.source,
                            severity: rule.severity,
                            messageEn: rule.messageEn,
                            messageMl: rule.messageMl,
                            betterChoiceAdviceEn: rule.adviceEn,
                            betterChoiceAdviceMl: rule.adviceMl,
                            ...{ deduction: rule.deduction },
                        };
                    }
                }
                else {
                    baseScore -= rule.deduction;
                    reasons.push({
                        ruleId: rule.id,
                        conditionCode: rule.conditionCode,
                        nutrient: String(rule.nutrient),
                        threshold: rule.threshold,
                        unit: rule.unit,
                        classification: rule.classification,
                        source: rule.source,
                        severity: rule.severity,
                        messageEn: rule.messageEn,
                        messageMl: rule.messageMl,
                        betterChoiceAdviceEn: rule.adviceEn,
                        betterChoiceAdviceMl: rule.adviceMl,
                        ...{ deduction: rule.deduction },
                    });
                }
            }
        }
    }
    const personalizedGuidanceScore = Math.max(0, Math.min(100, Math.round(baseScore)));
    const hasCriticalReason = reasons.some((r) => r.severity === 'critical');
    const hasHighReason = reasons.some((r) => r.severity === 'high');
    let status;
    if (hasAllergenHazard || personalizedGuidanceScore < 50) {
        status = 'NOT_A_GOOD_CHOICE';
    }
    else if (hasCriticalReason || hasHighReason || personalizedGuidanceScore < 80) {
        status = 'USE_CAUTION';
    }
    else {
        status = 'GOOD_CHOICE';
    }
    let overallSummaryEn = '';
    let overallSummaryMl = '';
    if (status === 'NOT_A_GOOD_CHOICE') {
        if (hasAllergenHazard) {
            overallSummaryEn = 'Allergen / dietary restriction hazard detected. Not recommended for your safety.';
            overallSummaryMl = 'നിങ്ങൾ ഒഴിവാക്കാൻ തിരഞ്ഞെടുത്ത ചേരുവകൾ ഇതിൽ അടങ്ങിയിരിക്കുന്നു. ഇത് ഒഴിവാക്കാൻ ശ്രദ്ധിക്കുക.';
        }
        else {
            overallSummaryEn = 'Nutrient levels exceed target limits for your selected health profile.';
            overallSummaryMl = 'നിങ്ങളുടെ ആരോഗ്യ ആവശ്യങ്ങൾക്ക് ഈ ഉൽപ്പന്നത്തിലെ പോഷകങ്ങളുടെ അളവ് അനുയോജ്യമല്ല.';
        }
    }
    else if (status === 'USE_CAUTION') {
        overallSummaryEn = 'Contains specific nutrients to consume in moderation according to your selected goals.';
        overallSummaryMl = 'നിങ്ങളുടെ ആരോഗ്യ പ്രൊഫൈൽ അനുസരിച്ച് ഇത് മിതമായ അളവിൽ മാത്രം ഉപയോഗിക്കുക.';
    }
    else {
        overallSummaryEn = 'Fits well with your health profile and dietary preferences.';
        overallSummaryMl = 'നിങ്ങളുടെ ആരോഗ്യ ലക്ഷ്യങ്ങൾക്കും മുൻഗണനകൾക്കും അനുയോജ്യമായ ഉൽപ്പന്നം.';
    }
    return {
        ruleSetVersion: constants_1.RULE_SET_VERSION,
        status,
        personalizedGuidanceScore,
        score: personalizedGuidanceScore, // Deprecated alias for backwards compatibility
        reasons,
        allergenWarnings,
        precautionaryTraces,
        hasAllergenHazard,
        kidneyAdvisoryEn,
        kidneyAdvisoryMl,
        overallSummaryEn,
        overallSummaryMl,
        isMissingNutritionData: missingFields.length > 0,
        missingFields,
    };
}
