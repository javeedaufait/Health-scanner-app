import {
  detectAllergensInIngredients as detectShared,
  normalizeIngredientText as normalizeShared,
  ALLERGEN_ALIAS_MAP as aliasMapShared,
} from '@health-scanner/shared';

export const detectAllergensInIngredients = detectShared;
export const normalizeIngredientText = normalizeShared;
export const ALLERGEN_ALIAS_MAP = aliasMapShared;
