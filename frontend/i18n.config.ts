import de from "./locales/de.yaml"

export default defineI18nConfig(()=>({
    legacy: true,
    locale: "de",
    messages: {
        de
    }
}))