// src/i18n/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";

const supportedLanguages = new Set(["en", "fr", "de"]);
const storedLanguage = localStorage.getItem("taxonline_lang")?.slice(0, 2);
const savedLang =
  storedLanguage && supportedLanguages.has(storedLanguage)
    ? storedLanguage
    : "fr";

document.documentElement.lang = savedLang;

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

i18n.on("languageChanged", (language) => {
  const normalizedLanguage = language.slice(0, 2);
  document.documentElement.lang = supportedLanguages.has(normalizedLanguage)
    ? normalizedLanguage
    : "fr";
});

export default i18n;
