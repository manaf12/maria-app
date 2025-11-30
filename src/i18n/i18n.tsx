// src/i18n/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";

const savedLang = localStorage.getItem("taxonline_lang") || "en";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      de: { translation: de },
    },
    lng: savedLang,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export default i18n;
