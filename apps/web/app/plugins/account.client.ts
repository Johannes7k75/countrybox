// Checks the session once on boot and keeps preferences in sync for signed-in users.
export default defineNuxtPlugin(() => {
  const { user, refresh, settingsVersion, syncedSnapshot, applySettings } = useAccount()
  const prefs = usePrefs()
  void refresh()
  let timer: ReturnType<typeof setTimeout> | undefined
  let pushing = false
  watch(
    prefs,
    () => {
      if (!user.value || JSON.stringify(prefs.value) === syncedSnapshot.value) return
      clearTimeout(timer)
      timer = setTimeout(() => void push(), 800)
    },
    { deep: true },
  )

  async function push() {
    if (pushing || !user.value) return
    pushing = true
    try {
      const { locale, ...rest } = prefs.value
      const res = await useApi().api.settings.$patch({
        json: { rowVersion: settingsVersion.value, locale, prefs: rest },
      })
      if (res.status === 200) {
        settingsVersion.value = (await res.json()).rowVersion
        syncedSnapshot.value = JSON.stringify(prefs.value)
      } else if (res.status === 409) applySettings((await res.json()).current)
    } catch {
      /* offline: next change retries */
    } finally {
      pushing = false
    }
  }
})
