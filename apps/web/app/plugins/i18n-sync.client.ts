// The learner's language preference (usePrefs → localStorage / account settings) is the source of truth for the locale.
export default defineNuxtPlugin((nuxtApp) => {
  const prefs = usePrefs()
  const i18n = nuxtApp.$i18n
  watch(
    () => prefs.value.locale,
    (l) => {
      if (i18n.locale.value !== l) void i18n.setLocale(l)
    },
    { immediate: true },
  )
})
