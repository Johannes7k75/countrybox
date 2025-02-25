import de from "~~/i18n/locales/de.json5";
import en from "~~/i18n/locales/en.json5"

export default defineI18nConfig(() => {
  return {
    // legacy: false,
    locale: "en",
    messages: {
      de,
      en,
    },
  }
});
