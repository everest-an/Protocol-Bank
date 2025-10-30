import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translations from './translations';

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: translations,
    lng: 'en', // Force English as default language
    fallbackLng: 'en', // Fallback language
    debug: false, // Set to true in development if needed
    
    interpolation: {
      escapeValue: false, // React already handles XSS safely
    },

    detection: {
      // Language detection order - localStorage first to respect user choice
      order: ['localStorage', 'querystring', 'cookie'],
      // Cache user language selection
      caches: ['localStorage'],
      // Disable automatic language detection from browser
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;

