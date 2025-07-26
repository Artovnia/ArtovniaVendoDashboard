import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import { defaultI18nOptions } from "../../../i18n/config"

export const I18n = () => {
  if (i18n.isInitialized) {
    return null
  }

  // Initialize with custom detector that uses vendor-specific storage keys
  i18n
    .use(
      new LanguageDetector(null, {
        lookupCookie: "vendor_lng",  // vendor-specific cookie name
        lookupLocalStorage: "vendor_lang", // vendor-specific localStorage key
        order: ["localStorage", "cookie", "navigator"],
      })
    )
    .use(initReactI18next)
    .init({
      ...defaultI18nOptions,
      detection: {
        // Override detection options
        caches: ["localStorage", "cookie"],
        lookupCookie: "vendor_lng",
        lookupLocalStorage: "vendor_lang",
        order: ["localStorage", "cookie", "navigator"],
      },
    })

  // Attempt to load from localStorage first
  try {
    const storedLang = localStorage.getItem("vendor_lang");
    const supportedLngs = defaultI18nOptions.supportedLngs || [];
    if (storedLang && Array.isArray(supportedLngs) && supportedLngs.includes(storedLang)) {
      i18n.changeLanguage(storedLang);
    }
  } catch (e) {
    console.warn("Failed to retrieve language preference", e);
  }

  return null
}

export { i18n }
