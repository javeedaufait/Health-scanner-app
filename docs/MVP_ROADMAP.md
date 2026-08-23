# AI Food Scanner — MVP Roadmap & Implementation Milestones

This roadmap outlines the phased execution strategy for building the AI Food Scanner MVP. In accordance with the methodology in Section 45, the project progresses in modular, testable, and verifiable milestones.

---

## 🎯 Milestone 1: Core Foundation & Health Profile (In Progress)
**Goal:** Establish the monorepo/workspace structure, backend infrastructure, shared domain schemas, authentication, health profile models, and mobile navigation scaffolding.

### Deliverables:
1. **Workspace & Shared Package:**
   - Monorepo structure with `@health-scanner/shared`.
   - Zod schemas for User, Health Profile, Nutrition, Products, and Rules.
   - Core TypeScript interfaces.
2. **Backend API Foundation:**
   - Node.js + Express + TypeScript server setup.
   - Database layer (PostgreSQL / SQLite fallback for quick local testing + migrations).
   - Auth endpoints (`/api/auth/register`, `/api/auth/login`).
   - Profile endpoints (`/api/me/profile`, `/api/me/health-profile`, `/api/me/restrictions`, `/api/me/medications`, `/api/me/disclaimer`).
   - Health conditions & dietary restrictions catalog endpoints.
3. **Deterministic Rule Engine (Core Logic):**
   - Independent pure TypeScript module: `evaluateFoodForUser(userProfile, productData)`.
   - Threshold-based heuristic rules (Diabetes, Hypertension, Cholesterol, Allergies).
   - Comprehensive unit test suite (100% coverage on core rules).
4. **Mobile Scaffolding (Expo + React Native):**
   - Expo project setup with Expo Router.
   - Theme system (accessible colors, typography, glassmorphism, vibrant badges).
   - i18n setup (English & Malayalam string catalogs).
   - Navigation: Onboarding Flow (Welcome -> Basic Info -> Health Conditions -> Allergens -> Medications -> Disclaimer) and Tab Navigation (Home, Scan, History, Profile).
   - Authentication & Profile State Management (Zustand + Secure Storage).

---

## 🎯 Milestone 2: Product Data Engine & Seed Dataset
**Goal:** Enable instant barcode lookups and Indian packaged foods database querying.

### Deliverables:
1. **Product Provider Abstraction:**
   - `IProductProvider` interface.
   - `InternalProductDatabaseProvider` with realistic Kerala & Indian supermarket foods (biscuits, oats, chips, drinks, instant noodles, milk, etc.).
   - `OpenFoodFactsProvider` fallback adapter for global & Indian EAN barcodes.
2. **Product Normalization:**
   - Automated conversion to standardized *per 100g* metrics.
   - Storage of original *per serving* metrics.
3. **Backend Endpoints:**
   - `GET /api/products/barcode/:barcode`
   - `GET /api/products/:id`

---

## 🎯 Milestone 3: Barcode Scanner & Instant Result UX
**Goal:** Connect the mobile camera to barcode scanning and render the 5-second decision result.

### Deliverables:
1. **Mobile Barcode Scanner Screen:**
   - Camera viewport with visual guide/reticle.
   - Support for EAN-13, EAN-8, UPC-A, UPC-E.
   - Audio/haptic scan feedback.
2. **Instant Result Screen:**
   - Primary Status Card: 🟢 **GOOD CHOICE**, 🟡 **USE CAUTION**, 🔴 **NOT A GOOD CHOICE**.
   - Top reasons bullet points tailored to user health conditions.
   - Allergen warning banner (prominent red).
   - Collapsible detailed nutrition table (Calories, Carbs, Sugars, Fat, Sodium, etc.) and ingredient list.
   - "Scan Another" and "Save to Favourites" action buttons.

---

## 🎯 Milestone 4: Nutrition Label OCR & AI Extraction Pipeline
**Goal:** Handle products without barcodes or unknown barcodes by photographing the nutrition/ingredient panel.

### Deliverables:
1. **OCR Label Capture UI:**
   - Secondary scanning mode: "Scan Nutrition Label & Ingredients".
   - Image review & crop/framing helper.
2. **Backend Vision Pipeline:**
   - `AIProvider` interface (OpenAI / Gemini vision integration).
   - Strict JSON extraction with fallback parsing and Zod schema validation.
   - Missing data handling (marks `null` rather than fabricating).
3. **End-to-End Fallback Flow:**
   - Barcode not found -> prompt label photo -> extract -> evaluate -> display result.

---

## 🎯 Milestone 5: AI Explanation Layer (Controlled & Safe)
**Goal:** Enhance the decision screen with a friendly 2-sentence conversational summary in English and Malayalam without introducing medical diagnoses.

### Deliverables:
1. **AI Explanation Service:**
   - Strict prompt engineering: Explains *only* rule engine outputs.
   - Multi-language output (English & Malayalam).
   - Strict medical safety guardrails.

---

## 🎯 Milestone 6: Scan History, Saved Favourites & Profile Management
**Goal:** Allow users to revisit past scans, manage favorites, and update their health profile anytime.

### Deliverables:
1. **Scan History:**
   - Persisted scan records with timestamp, product snapshot, and result status.
   - Filter by date or status.
2. **Saved Products:**
   - Bookmark/unbookmark products.
3. **Profile & Settings:**
   - Edit conditions, allergies, and medications.
   - Language switch (English <-> Malayalam).
   - Account deletion & privacy controls.

---

## 🎯 Milestone 7: Verification, Testing & Polish
**Goal:** Comprehensive automated tests, UX polish, error states, and final acceptance testing.

### Deliverables:
1. **Acceptance Test Scenario:**
   - User: Diabetes + Hypertension + Milk restriction.
   - Product: High added sugar + High sodium + Milk ingredient.
   - Result: 🔴 NOT A GOOD CHOICE / 🟡 USE CAUTION with explicit sugar, sodium, and milk allergen warnings.
2. **Security & Privacy Audit:**
   - Zero sensitive PII sent to AI.
   - Strict user data isolation.
3. **Comprehensive Typecheck, Lint & Unit Tests.**
