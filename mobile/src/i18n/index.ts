import en from './locales/en.json';
import ml from './locales/ml.json';

export type TranslationKey = keyof typeof en;
export type Language = 'en' | 'ml';

let currentLanguage: Language = 'en';

const translations: Record<Language, Record<string, string>> = {
  en,
  ml,
};

export function setLanguage(lang: Language) {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let str = translations[currentLanguage]?.[key] || translations.en[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
  }
  return str;
}
