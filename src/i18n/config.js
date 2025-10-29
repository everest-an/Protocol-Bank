import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translations from './translations';

i18n
  // 检测用户语言
  .use(LanguageDetector)
  // 将 i18n 实例传递给 react-i18next
  .use(initReactI18next)
  // 初始化 i18next
  .init({
    resources: translations,
    fallbackLng: 'en', // 默认语言
    debug: false, // 开发环境可以设置为 true
    
    interpolation: {
      escapeValue: false, // React 已经安全地处理了 XSS
    },

    detection: {
      // 语言检测顺序
      order: ['localStorage', 'navigator', 'htmlTag'],
      // 缓存用户语言选择
      caches: ['localStorage'],
    },
  });

export default i18n;

