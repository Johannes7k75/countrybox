import type { Locale, Region } from '@countrybox/catalog'
import type { Difficulty, Field, MapClickStyle, MapPolicy, MapPromptStyle, Mode, Scope } from '@countrybox/domain'

export type Theme = 'system' | 'light' | 'dark'
export interface SetupPrefs {
  prompt: Field
  answer: Field
  scope: Scope
  region: Region | 'world'
  length: number
  mode: Mode
  difficulty: Difficulty
  mapPrompt: MapPromptStyle
  mapClick: MapClickStyle
}
export interface Prefs {
  locale: Locale
  theme: Theme
  auto: boolean
  map: MapPolicy
  motion: boolean
  setup: SetupPrefs
}
const KEY = 'countrybox:prefs:v1'
export const defaultPrefs = (): Prefs => ({
  locale: typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en',
  theme: 'system',
  auto: false,
  map: 'after',
  motion: false,
  setup: {
    prompt: 'flag',
    answer: 'name',
    scope: 'un',
    region: 'world',
    length: 10,
    mode: 'practice',
    difficulty: 'standard',
    mapPrompt: 'outline-capital',
    mapClick: 'borders',
  },
})

function load(): Prefs {
  const base = defaultPrefs()
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null') as Partial<Prefs> | null
    if (raw && typeof raw === 'object') return { ...base, ...raw, setup: { ...base.setup, ...raw.setup } }
  } catch {
    /* storage unavailable */
  }
  return base
}

let started = false
/** Device preferences (localStorage). Synced to the account in a later slice. */
export function usePrefs() {
  const prefs = useState<Prefs>('prefs', load)
  if (!started && import.meta.client) {
    started = true
    const apply = () => {
      const root = document.documentElement
      root.lang = prefs.value.locale
      root.dataset.reduceMotion = String(prefs.value.motion)
      if (prefs.value.theme === 'system') delete root.dataset.theme
      else root.dataset.theme = prefs.value.theme
      try {
        localStorage.setItem(KEY, JSON.stringify(prefs.value))
      } catch {
        /* ignore */
      }
    }
    watch(prefs, apply, { deep: true, immediate: true })
  }
  return prefs
}

export function useDark() {
  const prefs = usePrefs()
  const media = import.meta.client ? window.matchMedia('(prefers-color-scheme: dark)') : null
  const systemDark = ref(media?.matches ?? false)
  media?.addEventListener('change', (e) => {
    systemDark.value = e.matches
  })
  return computed(() => prefs.value.theme === 'dark' || (prefs.value.theme === 'system' && systemDark.value))
}
