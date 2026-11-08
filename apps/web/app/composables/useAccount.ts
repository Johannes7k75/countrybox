import type { Me, Settings } from '@countrybox/contracts'

export type AccountUser = Me

/** Signed-in user, due count, and server-synced preferences. Guests get user = null. */
export function useAccount() {
  const user = useState<AccountUser | null>('account-user', () => null)
  const checked = useState<boolean>('account-checked', () => false)
  const dueCount = useState<number>('due-count', () => 0)
  const settingsVersion = useState<number>('settings-version', () => 0)
  /** JSON of the preferences last confirmed by the server; unchanged prefs are not pushed again. */
  const syncedSnapshot = useState<string>('settings-snapshot', () => '')

  async function refresh() {
    try {
      const res = await useApi().api.me.$get()
      const body = await res.json() // always drain the body (keeps proxied connections from lingering)
      user.value = res.status === 200 && 'id' in body ? body : null
    } catch {
      user.value = null
    }
    checked.value = true
    if (user.value) {
      await Promise.all([refreshDue(), pullSettings()])
    } else dueCount.value = 0
  }
  async function refreshDue() {
    if (!user.value) return
    const res = await useApi().api.review.queue.$get()
    const body = await res.json()
    if (res.status === 200 && 'due' in body) dueCount.value = body.due.length
  }
  /** Server preferences win on sign-in; afterwards local changes are pushed (see plugins/account.client.ts). */
  async function pullSettings() {
    const res = await useApi().api.settings.$get()
    const body = await res.json()
    if (res.status === 200 && 'rowVersion' in body) applySettings(body)
  }
  function applySettings(s: Settings) {
    const prefs = usePrefs()
    settingsVersion.value = s.rowVersion
    if (s.rowVersion === 0) return // nothing stored yet: keep device prefs, first push will create them
    prefs.value = {
      ...prefs.value,
      locale: s.locale,
      ...s.prefs,
      setup: { ...prefs.value.setup, ...s.prefs.setup },
    }
    syncedSnapshot.value = JSON.stringify(prefs.value)
  }
  async function signOut() {
    await useAuthClient().signOut()
    user.value = null
    dueCount.value = 0
    settingsVersion.value = 0
  }
  return { user, checked, dueCount, settingsVersion, syncedSnapshot, refresh, refreshDue, signOut, applySettings }
}
