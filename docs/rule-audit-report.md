# Comprehensive Health & Nutrition Rule Audit Report (Revised & Rigorous)

**Date**: August 24, 2026  
**Application**: AI Food Scanner (Kerala / India Focus)  
**Audit Purpose**: Rigorous, Evidence-Based Distinction Between Regulatory Label Claims, Draft Standards, Daily Dietary Allowances, and Heuristic App Rules  
**Primary Reference Authorities**:
1. **FSSAI** – *Food Safety and Standards (Labelling and Display) Regulations, 2020* (Final Regulations) & *Draft FoPL (Indian Nutrition Rating) 2022/2023 Guidelines* (Draft/Proposed)
2. **ICMR-NIN** – *Dietary Guidelines for Indians (2024)* & *Recommended Dietary Allowances (RDA 2020)* (Daily Dietary Recommendations)
3. **WHO** – *WHO Guidelines on Sugars Intake (2015)*, *Global Sodium Benchmarks for Packaged Foods (2021)*, and *Trans Fat Elimination Regulations (2023)*

---

## 1. Core Audit Principles & Methodology

To ensure strict scientific integrity and avoid misrepresenting regulatory or clinical standards:

1. **No Conflation of Label Claims with Disease Cutoffs**: An FSSAI "Low Sugar" ($\le 5\text{g}/100\text{g}$) or "Low Sodium" ($\le 120\text{mg}/100\text{g}$) criteria is an **official food-labelling claim threshold**. It is NOT a clinical diabetes or hypertension diagnostic threshold. Using it as a disease rule is an **App Heuristic**.
2. **Draft/Proposed Material Must Be Explicitly Designated**: FSSAI Front-of-Pack Labelling (FoPL / INR 2022) criteria (e.g. $10\text{g}/100\text{g}$ added sugar, $600\text{mg}/100\text{g}$ sodium) are **Draft/Proposed HFSS (High in Fat, Sugar, Salt) Benchmarks**, NOT final enforced regulations or medical guidelines.
3. **Daily Recommendations vs. Per-100g Product Density**: ICMR-NIN and WHO daily nutrient limits (e.g., WHO $<25\text{g}$ free sugar/day or $<2000\text{mg}$ sodium/day) are **Daily Total Diet Guidelines**. They do NOT define per-100g product thresholds unless explicitly established as a product category benchmark (e.g., WHO 2021 Global Sodium Benchmarks).
4. **Classification Rigor**:
   - `DIRECTLY_SUPPORTED`: The source supports the **EXACT SAME USE** of the per-100g threshold in our app (e.g., FSSAI Trans Fat limit $<0.2\text{g}/100\text{g}$).
   - `INDIRECTLY_SUPPORTED`: Derived from official draft FoPL benchmarks or WHO product category benchmarks.
   - `HEURISTIC`: An app-designed consumer guidance rule derived from general nutrition principles where no disease-specific per-100g threshold exists in official literature.
   - `CLINICAL_REVIEW_REQUIRED`: Disease conditions (e.g. Kidney Disease) requiring individualized nephrology/dietitian supervision rather than static 100g heuristics.

---

## 2. Revised Master Audit Table

| Rule ID | Current Threshold | What the Source Actually Supports | Distinguishing Category | Classification | Recommended Action |
|---|---|---|---|---|---|
| `rule-diabetes-added-sugar-high` | Added Sugars $\ge 10\text{g} / 100\text{g}$ | **Draft FSSAI FoPL 2022** Schedule I proposes $10\text{g}/100\text{g}$ as the High Added Sugar (HFSS) indicator for solid foods. **ICMR-NIN 2024** recommends $<25\text{g}/day$ total diet added sugar. | **Draft FoPL Benchmark / Daily Intake Guideline** | `INDIRECTLY_SUPPORTED` | **Keep**. Label clearly in UI as *"Draft FSSAI FoPL HFSS Benchmark & ICMR-NIN Daily Sugar Limit"*. |
| `rule-diabetes-added-sugar-mod` | Added Sugars $\ge 5\text{g} / 100\text{g}$ | **FSSAI 2020 Regulations** (Schedule I) defines $\le 5\text{g}/100\text{g}$ as the voluntary claim criteria for "Low Sugar". It is NOT a clinical diabetes cutoff. | **Official Food-Labelling Claim Threshold** | `HEURISTIC` | **Keep as App Heuristic**. Re-classify from `DIRECTLY_SUPPORTED` to `HEURISTIC`. Update UI explanation to *"Exceeds FSSAI Low-Sugar label claim benchmark"*. |
| `rule-diabetes-sugars-high` | Total Sugars $\ge 15\text{g} / 100\text{g}$ | **Draft FSSAI FoPL 2022** Schedule I proposes $15\text{g}/100\text{g}$ as the High Total Sugar benchmark for solid food. | **Draft FoPL Benchmark** | `INDIRECTLY_SUPPORTED` | **Keep**. Clarify source as *"Draft FSSAI FoPL HFSS Benchmark (2022)"*. |
| `rule-prediabetes-sugar-high` | Added Sugars $\ge 8\text{g} / 100\text{g}$ | Intermediate threshold between 5g and 10g. No primary source specifies an 8g prediabetes product cutoff. | **App Heuristic** | `HEURISTIC` | **Keep as App Heuristic**. Label explicitly as consumer guidance heuristic. |
| `rule-hypertension-sodium-critical` | Sodium $\ge 800\text{mg} / 100\text{g}$ | **WHO Global Sodium Benchmarks (2021)** defines $800\text{mg}/100g$ for savoury snacks/instant noodles. **WHO 2023** daily sodium limit is $<2000\text{mg}/day$. | **Product-Level Nutrient Benchmark** | `INDIRECTLY_SUPPORTED` | **Keep**. Cite *"WHO Global Sodium Product Benchmark (2021)"*. |
| `rule-hypertension-sodium-high` | Sodium $\ge 500\text{mg} / 100\text{g}$ | **Draft FSSAI FoPL 2022** Schedule I specifies $600\text{mg}/100\text{g}$ as the High Sodium (HFSS) threshold. | **Draft FoPL Benchmark** | `INDIRECTLY_SUPPORTED` | **Change Threshold to 600mg**. Adjust from 500mg to $600\text{mg}/100\text{g}$ to align directly with Draft FSSAI FoPL. |
| `rule-hypertension-sodium-mod` | Sodium $\ge 350\text{mg} / 100\text{g}$ | Intermediate sodium level above FSSAI Low Sodium claim ($120\text{mg}/100\text{g}$). | **App Heuristic** | `HEURISTIC` | **Keep as App Heuristic**. |
| `rule-cholesterol-satfat-high` | Saturated Fat $\ge 5\text{g} / 100\text{g}$ | **Draft FSSAI FoPL 2022** Schedule I specifies $5\text{g}/100\text{g}$ as High Saturated Fat threshold for solid foods. | **Draft FoPL Benchmark** | `INDIRECTLY_SUPPORTED` | **Keep**. Cite *"Draft FSSAI FoPL HFSS Benchmark (2022)"*. |
| `rule-cholesterol-transfat` | Trans Fat $> 0.1\text{g} / 100\text{g}$ | **FSSAI 2022 Regulations** mandates industrial trans fats $<2\%$ of total fats and caps "Trans Fat Free" claims at $<0.2\text{g}/100\text{g}$. **WHO REPLACE** targets 0g industrial trans fat. | **Official Product Regulation & Claim Limit** | `DIRECTLY_SUPPORTED` | **Keep**. Set threshold to $>0.2\text{g}/100\text{g}$ (or $>0.1\text{g}$). Directly supported by FSSAI trans-fat regulations. |
| `rule-heart-satfat` | Saturated Fat $\ge 4\text{g} / 100\text{g}$ | Intermediate saturated fat threshold for heart health. | **App Heuristic** | `HEURISTIC` | **Keep as App Heuristic**. |
| `rule-weight-energy-high` | Energy $\ge 450\text{kcal} / 100\text{g}$ | High energy density benchmark (solid food calorie density). | **App Heuristic** | `HEURISTIC` | **Keep as App Heuristic**. |
| `rule-weight-sugar-high` | Total Sugars $\ge 12\text{g} / 100\text{g}$ | Weight management sugar benchmark. | **App Heuristic** | `HEURISTIC` | **Keep as App Heuristic**. |
| `kidney-disease-advisory` | Kidney Disease | Clinical nephrology guidelines require GFR-specific electrolyte monitoring (Potassium, Phosphorus, Sodium, Protein). | **Clinical Recommendation** | `CLINICAL_REVIEW_REQUIRED` | **Change**. Remove numerical point deductions. Provide non-clinical advisory notice. |
| `allergen-restriction-check` | Allergens | **FSSAI 2020 Regulations** (Schedule II) mandates declaration of 8 major allergens. | **Official Product Regulation** | `DIRECTLY_SUPPORTED` | **Keep**. Evaluated separately as a **Biological Safety Hazard**, independent of numerical nutrient score. |

---

## 3. Architecture & Terminology Standardizations

1. **Score Naming**: The output score is formally named **"Personalized Guidance Score"**. It is explicitly defined as an **app-generated heuristic guidance score**, NOT a validated clinical score or medical diagnosis.
2. **Separation of Allergen Safety Warnings**:
   - Allergen matches output `hasAllergenHazard: true` and set status to `NOT_A_GOOD_CHOICE`.
   - Nutrient rules compute the 0–100 `Personalized Guidance Score`.
3. **Missing Data Handling**:
   - `null` or `undefined` nutrient values are treated as `UNKNOWN`, NOT zero.
   - Does not deduct false score points. Sets `isMissingNutritionData` flag.
4. **Kidney Disease Handling**:
   - Provides conservative advisory: *"Kidney disease requires personalized clinical management. Please consult your nephrologist or renal dietitian for specialized dietary limits."*

---

## 4. Mandatory Medical Disclaimers

### English Disclaimer:
> *"This app provides general nutritional information and a Personalized Guidance Score based on public guidelines (FSSAI, ICMR-NIN, WHO) and your selected preferences. It is an app-generated heuristic, not medical advice, a clinical diagnosis, or a guarantee of safety. Always consult a qualified healthcare professional for medical decisions."*

### Malayalam Disclaimer:
> *"ഈ ആപ്പ് നൽകുന്നത് പൊതുവായ പോഷകാഹാര വിവരങ്ങളും നിങ്ങളുടെ തിരഞ്ഞെടുപ്പുകൾക്ക് അനുസൃതമായ പേഴ്സണലൈസ്ഡ് ഗൈഡൻസ് സ്കോറും മാത്രമാണ്. ഇത് ആപ്പ് നൽകുന്ന ഒരു സൂചന മാത്രമാണ്, വൈദ്യോപദേശമോ ക്ലിനിക്കൽ രോഗനിർണ്ണയമോ അല്ല. ആരോഗ്യപരമായ തീരുമാനങ്ങൾക്ക് എപ്പോഴും ഡോക്ടറുടെ സേവനം തേടുക."*
