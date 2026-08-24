# Comprehensive Health & Nutrition Rule Audit Report

**Date**: August 24, 2026  
**Application**: AI Food Scanner (Kerala / India Focus)  
**Audit Target**: Health Rule Engine, Scoring Algorithm, Evidence Claims, and Medical Disclaimers  
**Primary Reference Standards**:
1. **FSSAI** – *Food Safety and Standards (Labelling and Display) Regulations, 2020* & *Draft FoPL (Indian Nutrition Rating) 2022/2023 Guidelines*
2. **ICMR-NIN** – *Dietary Guidelines for Indians (2024)* & *Recommended Dietary Allowances (RDA 2020)*
3. **WHO** – *WHO Guidelines on Sugars Intake (2015)*, *Sodium Benchmarks for Packaged Foods (2021)*, and *Trans Fat Elimination Guidelines (2023)*

---

## 1. Executive Summary & Audit Mandate

The AI Food Scanner app evaluates packaged food items for users based on their personal health conditions (e.g., Diabetes, Hypertension, High Cholesterol) and dietary restrictions (e.g., Milk allergy, Vegan).

### Key Audit Audit Principles Applied:
- **No False Authority**: A rule is attributed to ICMR-NIN, FSSAI, or WHO **only** if the primary source explicitly supports that exact cutoff.
- **Distinction Between Daily Intake vs. Product Density**: Daily nutrient recommendations (e.g., WHO $<2000\text{mg}$ sodium/day) cannot be assumed to validate a per-100g product threshold unless explicitly established by front-of-pack labelling (FoPL) standards.
- **Draft vs. Final Regulations**: FSSAI Draft FoPL material is explicitly designated as **[Draft/Proposed FSSAI FoPL]**.
- **Scoring Description**: The scoring output is described as a **"Personalized Heuristic Guidance Score"**, NOT a "clinical diagnosis" or medical guarantee of safety.
- **Separation of Allergens vs. Nutrition Scoring**: Allergen matches are handled as **Hard Safety Warnings**, distinct from numerical nutrient deductions.
- **Missing Data**: Missing nutrition values are explicitly flagged as **`UNKNOWN` / Missing**, not assumed to be zero.
- **Kidney Disease Scrutiny**: Specialized medical conditions (e.g., Kidney Disease) yield conservative clinical advisory notices rather than automated health points.

---

## 2. Complete Inventory & Classification of Current Rules

Every implemented rule has been audited and classified under one of the 5 mandatory categories:
1. **`DIRECTLY_SUPPORTED`**: Explicitly backed by published, final regulations/standards (e.g., FSSAI 2020 claim limits).
2. **`INDIRECTLY_SUPPORTED`**: Derived from official draft FoPL benchmarks or established product category benchmarks (e.g., WHO global sodium benchmarks).
3. **`HEURISTIC`**: Derived rule designed for personal guidance where official standards do not specify single-product per-100g cutoffs.
4. **`UNSUPPORTED`**: Thresholds with insufficient primary source evidence.
5. **`CLINICAL_REVIEW_REQUIRED`**: Medical conditions requiring physician/dietitian oversight.

---

### Audit Table of All Rules

| Rule ID | Target Condition | Nutrient / Target | Current Threshold | Primary Source Reference | Classification | Audit Findings & Recommended Actions |
|---|---|---|---|---|---|---|
| `rule-diabetes-added-sugar-high` | Diabetes | Added Sugars | $\ge 10\text{g} / 100\text{g}$ | FSSAI Draft FoPL 2022 Schedule I ($10\text{g}/100\text{g}$ solid threshold); ICMR-NIN 2024 Daily Added Sugar limit ($<25\text{g}/day$) | `INDIRECTLY_SUPPORTED` | Supported by FSSAI Draft FoPL Schedule I ($10\text{g}/100\text{g}$). Update description to clarify it is based on FSSAI Draft FoPL & ICMR-NIN sugar guidance. |
| `rule-diabetes-added-sugar-mod` | Diabetes | Added Sugars | $\ge 5\text{g} / 100\text{g}$ | FSSAI 2020 Labelling Regs (Schedule I: "Low Sugar" claim threshold is $\le 5\text{g}/100\text{g}$) | `DIRECTLY_SUPPORTED` | Directly supported by FSSAI 2020 Low Sugar definition. Retain threshold ($5\text{g}/100\text{g}$). |
| `rule-diabetes-sugars-high` | Diabetes | Total Sugars | $\ge 15\text{g} / 100\text{g}$ | FSSAI Draft FoPL 2022 Schedule I ($15\text{g}/100\text{g}$ for solid foods) | `INDIRECTLY_SUPPORTED` | Directly matches FSSAI Draft FoPL high total sugar threshold for solid food. Re-classify as Indirectly Supported. |
| `rule-prediabetes-sugar-high` | Prediabetes | Added Sugars | $\ge 8\text{g} / 100\text{g}$ | Intermediate heuristic cutoff between 5g and 10g | `HEURISTIC` | Primary sources do not specify an 8g prediabetes threshold. Re-classify as `HEURISTIC` for prediabetes guidance. |
| `rule-hypertension-sodium-critical` | Hypertension | Sodium | $\ge 800\text{mg} / 100\text{g}$ | WHO Global Sodium Benchmarks 2021 (Instant noodles / savoury snacks $800\text{mg}/100\text{g}$); WHO Daily Sodium $<2000\text{mg}$ | `INDIRECTLY_SUPPORTED` | Matches WHO Category Benchmark for ultra-processed savoury items. Re-classify as Indirectly Supported (WHO Category Benchmarks). |
| `rule-hypertension-sodium-high` | Hypertension | Sodium | $\ge 500\text{mg} / 100\text{g}$ | FSSAI Draft FoPL 2022 ($600\text{mg}/100\text{g}$); WHO Sodium Benchmark | `INDIRECTLY_SUPPORTED` | **Adjust threshold from 500mg to 600mg** to align directly with FSSAI Draft FoPL / WHO $600\text{mg}/100\text{g}$ high-sodium cutoff. |
| `rule-hypertension-sodium-mod` | Hypertension | Sodium | $\ge 350\text{mg} / 100\text{g}$ | Intermediate threshold above FSSAI Low Sodium ($120\text{mg}/100\text{g}$) | `HEURISTIC` | Intermediate threshold. Re-classify as `HEURISTIC` for sodium awareness. |
| `rule-cholesterol-satfat-high` | High Cholesterol | Saturated Fat | $\ge 5\text{g} / 100\text{g}$ | FSSAI Draft FoPL 2022 Schedule I ($5\text{g}/100\text{g}$ solid threshold); WHO Saturated Fat Guidelines ($<10\%$ E) | `INDIRECTLY_SUPPORTED` | Matches FSSAI Draft FoPL cutoff for High Saturated Fat in solid foods. Re-classify as Indirectly Supported. |
| `rule-cholesterol-transfat` | High Cholesterol | Trans Fat | $> 0.1\text{g} / 100\text{g}$ | FSSAI 2020 Regulations (Trans fat free claim limit $<0.2\text{g}/100\text{g}$); WHO Elimination of Trans Fats | `DIRECTLY_SUPPORTED` | Directly supported by FSSAI trans-fat regulations ($<0.2\text{g}$ per 100g for 0g claim). Adjust threshold slightly to $> 0.2\text{g}$ or $>0.1\text{g}$. |
| `rule-heart-sodium-satfat` | Heart Health | Saturated Fat | $\ge 4\text{g} / 100\text{g}$ | Intermediate heuristic threshold | `HEURISTIC` | Intermediate threshold. Re-classify explicitly as `HEURISTIC`. |
| `rule-weight-energy-high` | Weight Management | Energy (Kcal) | $\ge 450\text{kcal} / 100\text{g}$ | High energy density benchmark (FSSAI / ICMR High Calorie density) | `HEURISTIC` | Useful energy density metric. Re-classify as `HEURISTIC`. |
| `rule-weight-sugar-high` | Weight Management | Sugars | $\ge 12\text{g} / 100\text{g}$ | Intermediate weight management heuristic | `HEURISTIC` | Intermediate threshold. Re-classify as `HEURISTIC`. |
| `kidney-disease-advisory` | Kidney Disease | All Nutrients | Clinical Advisory | Clinical Practice Guidelines (KDOQI / KDIGO Guidelines) | `CLINICAL_REVIEW_REQUIRED` | Automatic point scoring cannot replace clinical nephrology management. Replaces points with a **Conservative Non-Clinical Advisory Notice**. |
| `allergen-restriction-check` | Allergens / Restrictions | Ingredients / Allergens | Exact Match | FSSAI 2020 Mandatory Declaration of 8 Major Allergens (Schedule II) | `DIRECTLY_SUPPORTED` | Directly supported by FSSAI Allergen Declaration Regulations. Evaluated separately as a **Hard Safety Warning**, independent of numerical scoring. |

---

## 3. Analysis of System Architecture & Terminology Adjustments

### A. "Personalized Heuristic Guidance Score" vs. "Clinical Diagnosis"
- **Audit Requirement**: The term "clinical score", "medically safe", or "WHO approved" must be removed.
- **Adjustment**: The app's scoring output is explicitly termed **"Personalized Heuristic Guidance Score"**. It represents an informative consumer guide derived from personal preferences and public guidelines, NOT a diagnostic medical tool.

### B. Separation of Allergen Safety Warnings from Nutrient Scoring
- **Audit Requirement**: Allergens represent immediate biological safety hazards (e.g. anaphylaxis risk for peanut allergy), whereas nutrient thresholds represent gradual dietary quality indicators.
- **Adjustment**: 
  - **Nutrient Engine**: Calculates a 0–100 Guidance Score based on nutrient thresholds.
  - **Allergen Engine**: Evaluates independently. If an allergen is detected, it outputs a **Hard Safety Hazard Alert** and sets assessment status to `NOT_A_GOOD_CHOICE`, keeping the allergen alert distinct from nutrient point deductions.

### C. Treatment of Missing / Unknown Nutrition Data
- **Audit Requirement**: Missing values on food labels must not be treated as zero.
- **Adjustment**: Missing values are stored as `null` / `UNKNOWN`. If key fields (e.g., sodium or sugar) are missing, the evaluator outputs an explicit notice: *"Data Incomplete: Sodium/Sugar is not listed on this package."*

### D. Kidney Disease Handling
- **Audit Requirement**: Kidney disease (CKD) requires clinical monitoring of Potassium, Phosphorus, Sodium, and Protein based on GFR stage.
- **Adjustment**: The engine does NOT deduct arbitrary score points for kidney disease. Instead, it flags a prominent clinical notice: *"Kidney disease requires tailored clinical management. Please consult your nephrologist or renal dietitian for specific dietary limits."*

---

## 4. Updates to Medical Disclaimers & Language (English & Malayalam)

### Mandatory Disclaimer (English):
> *"This app provides general nutritional information and personalized guidance based on public guidelines (FSSAI, ICMR-NIN, WHO) and your inputs. It is not medical advice, a clinical diagnosis, or a guarantee of safety. Always consult a qualified healthcare professional for medical decisions."*

### Mandatory Disclaimer (Malayalam):
> *"ഈ ആപ്പ് നൽകുന്നത് പൊതുവായ പോഷകാഹാര വിവരങ്ങളും (FSSAI, ICMR-NIN, WHO മാർഗ്ഗനിർദ്ദേശങ്ങൾ) നിങ്ങളുടെ മുൻഗണനകൾക്ക് അനുസൃതമായ പൊതുവായ നിർദ്ദേശങ്ങളും മാത്രമാണ്. ഇത് വൈദ്യോപദേശമോ ക്ലിനിക്കൽ രോഗനിർണ്ണയമോ അല്ല. ആരോഗ്യപരമായ തീരുമാനങ്ങൾക്ക് എപ്പോഴും ഡോക്ടറുടെ സേവനം തേടുക."*

---

## 5. Audit Conclusions & Implementation Steps

1. **Update Code Constants**: Update `packages/shared/src/constants/index.ts` and `mobile/src/shared/constants/index.ts` with exact source attributions and updated classifications.
2. **Update Evaluator Logic**: Refactor `evaluator.ts` to separate Allergen Warnings from Numerical Nutrient Deductions and handle `null`/`UNKNOWN` values properly.
3. **Update Unit Tests**: Update unit tests in `tests/unit/rule-engine.test.ts` to reflect the updated threshold classifications and separate allergen checks.
4. **Update UI Wording**: Ensure all UI screens display "Personalized Guidance Score" and the updated non-clinical disclaimer.
