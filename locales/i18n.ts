import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import en from "./en.json";
import vi from "./vi.json";

const resources = {
  en: { translation: en },
  vi: { translation: vi },
};

function getDeviceLanguage() {
  try {
    const locales = Localization.getLocales();

    if (Array.isArray(locales) && locales.length > 0) {
      const first = locales[0];

      if (first?.languageCode && resources[first.languageCode as keyof typeof resources]) {
        return first.languageCode;
      }

      if (first?.languageTag) {
        const shortCode = first.languageTag.split("-")[0];
        if (resources[shortCode as keyof typeof resources]) {
          return shortCode;
        }
      }
    }
  } catch (error) {
    console.log("[i18n] getDeviceLanguage error:", error);
  }

  return "en";
}

const deviceLanguage = getDeviceLanguage();

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;