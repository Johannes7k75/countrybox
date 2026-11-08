import type { CatalogCountry, Locale } from '@countrybox/catalog'

/** Text/image facts answered by picking one of four options. */
export const TEXT_FIELDS = ['flag', 'name', 'capital', 'tld', 'callingCode'] as const
/** `location` = the country's place on the map: shown as a map prompt, or answered by clicking the map. */
export const FIELDS = [...TEXT_FIELDS, 'location'] as const
export type Field = (typeof FIELDS)[number]

export type Direction = `${Field}-${Field}`
const pairs = (fs: readonly Field[]): Direction[] =>
  fs.flatMap((a) => fs.filter((b) => b !== a).map((b) => `${a}-${b}` as Direction))
/** All 30 ordered prompt→answer pairs (6 fields). */
export const DIRECTIONS: Direction[] = pairs(FIELDS)
/** The 20 classic directions without the map — the ones server-scheduled reviews support. */
export const REVIEW_DIRECTIONS: Direction[] = pairs(TEXT_FIELDS)

/** How a map prompt shows the country. */
export const MAP_PROMPT_STYLES = ['outline-capital', 'outline', 'capital'] as const
export type MapPromptStyle = (typeof MAP_PROMPT_STYLES)[number]
/** How the click map looks: all borders drawn + highlight on click, or bare land without borders or highlight. */
export const MAP_CLICK_STYLES = ['borders', 'silhouette'] as const
export type MapClickStyle = (typeof MAP_CLICK_STYLES)[number]

export const isClickAnswer = (d: Direction) => d.endsWith('-location')
export const isMapPrompt = (d: Direction) => d.startsWith('location-')

export function parseDirection(d: string): [Field, Field] | null {
  const [a, b] = d.split('-') as [Field, Field]
  return FIELDS.includes(a) && FIELDS.includes(b) && a !== b ? [a, b] : null
}
export const directionOf = (prompt: Field, answer: Field): Direction => `${prompt}-${answer}`

/** Displayable values of a field. Empty means the field is unknown / not applicable for this entity. */
export function fieldValues(c: CatalogCountry, field: Field, locale: Locale): string[] {
  switch (field) {
    case 'flag':
      return [c.id]
    case 'name':
      return [c.name[locale]]
    case 'capital':
      return c.capitals[locale]
    case 'tld':
      return c.tlds
    case 'callingCode':
      return c.callingCodes.map((x) => '+' + x)
    case 'location':
      return c.map ? [c.name[locale]] : []
  }
}

/** Identity keys used for ambiguity checks — locale-independent so a question is valid in EN and DE. */
export function fieldKeys(c: CatalogCountry, field: Field): string[] {
  switch (field) {
    case 'flag':
      return ['flag:' + c.flagKey]
    case 'name':
      return [c.name.en, c.name.de].map((x) => 'name:' + normalize(x))
    case 'capital':
      return [...c.capitals.en, ...c.capitals.de].map((x) => 'cap:' + normalize(x))
    case 'tld':
      return c.tlds.map((x) => 'tld:' + x.toLowerCase())
    case 'callingCode':
      return c.callingCodes.map((x) => 'cc:' + x)
    case 'location':
      return c.map ? ['loc:' + c.id] : []
  }
}

export const hasField = (c: CatalogCountry, field: Field) =>
  fieldKeys(c, field).length > 0 && (field !== 'capital' || c.capitals.en.length > 0)

export function overlaps(a: string[], b: string[]): boolean {
  if (!a.length || !b.length) return false
  const s = new Set(a)
  return b.some((x) => s.has(x))
}

/** Accent/case-insensitive normalization for search and equivalence. */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").toLowerCase().trim()
}
