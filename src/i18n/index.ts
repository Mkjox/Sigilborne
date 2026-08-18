import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import tr from './locales/tr.json';
import es from './locales/es.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';

// Get the device's current locale
const locales = Localization.getLocales();
const deviceLanguage = locales[0]?.languageCode || 'en';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
  es: { translation: es },
  zh: { translation: zh },
  ja: { translation: ja },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      useSuspense: false, // avoids issues with concurrent mode in some RN setups
    },
  });

export default i18n;
