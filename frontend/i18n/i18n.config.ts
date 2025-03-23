import yaml from "yaml"
import type { DefaultLocaleMessageSchema } from "#i18n";

async function loadLocaleFiles() {
  const files = import.meta.glob('~~/i18n/locales/*.yml', { query: "?raw", import: "default" });
  const locales: Record<string, Object> = {}

  for (const file in files) {
    const fileName = file.match(/.+\/(.+).yml$/)![1]!
    locales[fileName] = yaml.parse(await files[file]!() as string)
  }

  return locales
}


export default defineI18nConfig(async () => {
  const locales = await loadLocaleFiles() as { [x: string]: DefaultLocaleMessageSchema }
  return {
    // legacy: false,
    locale: "de",
    fallbackLocale: "en",
    messages: locales

  }
});
