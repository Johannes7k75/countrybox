import type { CatalogCountry, Locale, Region } from '@countrybox/catalog'
import { fieldValues, type Field } from '@countrybox/domain'

/**
 * Translation + catalog formatting helpers.
 * UI strings come from vue-i18n message files (apps/web/i18n/locales/<code>.json): call t with a namespaced key
 * and named params, or with a count for plural messages ("{n} card | {n} cards"). Country data (names, capitals) is localised in the catalog.
 */
export function useT() {
  const { t, locale: i18nLocale, locales, localeProperties } = useI18n()
  const locale = computed(() => i18nLocale.value)
  const name = (c: CatalogCountry) => c.name[locale.value]
  const capital = (c: CatalogCountry) => c.capitals[locale.value].join(' / ') || '—'
  const value = (c: CatalogCountry, f: Field) => fieldValues(c, f, locale.value).join(' / ')
  const field = (f: Field, long = false) => (long ? t(`fieldsLong.${f}`) : t(`fields.${f}`))
  const region = (r: Region | 'world') => t(`regions.${r}`)
  const coord = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? pos : neg}`
  const coords = (c: CatalogCountry) =>
    c.center ? `${coord(c.center[0], 'N', 'S')} · ${coord(c.center[1], t('common.east'), t('common.west'))}` : ''
  /** BCP-47 tag for Intl date/number formatting, from the locale config (e.g. "de-DE"). */
  const dateLocale = computed(() => localeProperties.value.language ?? locale.value)
  /** Configured UI languages ({ code, name }) — drives every language switch. */
  const languages = computed(() => locales.value.map((l) => ({ code: l.code, name: l.name ?? l.code })))
  return { t, locale, dateLocale, languages, name, capital, value, field, region, coords }
}
