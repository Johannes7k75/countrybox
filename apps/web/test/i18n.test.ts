import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

/** Message catalogue integrity: every locale has the same keys, placeholders and plural forms; every key used in code exists. */
const dir = fileURLToPath(new URL('../i18n/locales/', import.meta.url))
const appDir = fileURLToPath(new URL('../app/', import.meta.url))
type Tree = { [k: string]: string | Tree }
const flat = (o: Tree, p = ''): Record<string, string> =>
  Object.fromEntries(
    Object.entries(o).flatMap(([k, v]) =>
      typeof v === 'string' ? [[p + k, v]] : Object.entries(flat(v, `${p}${k}.`)),
    ),
  )
const locales = Object.fromEntries(
  readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => [f.replace('.json', ''), flat(JSON.parse(readFileSync(join(dir, f), 'utf8')))]),
)
const en = locales.en
const placeholders = (m: string) =>
  [...m.matchAll(/\{(\w+)\}/g)]
    .map((x) => x[1])
    .sort()
    .join(',')
const branches = (m: string) => m.split(/(?<!\{')\|(?!'\})/).length
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) =>
    statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : /\.(vue|ts)$/.test(f) ? [join(d, f)] : [],
  )
const source = walk(appDir)
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')
const usedStatic = new Set([...source.matchAll(/\bt\('([\w.]+)'/g)].map((m) => m[1]))
// keys passed around as plain strings (e.g. option lists: { label: 'map.styleBorders' } → t(o.label))
const quoted = new Set([...source.matchAll(/'([a-zA-Z]+\.[\w.]+)'/g)].map((m) => m[1]))
const usedDynamicPrefixes = [...source.matchAll(/\bt\(`([\w.]+)\$\{/g)].map((m) => m[1]) // e.g. t(`fields.${f}`)

describe('i18n message catalogue', () => {
  it('has at least en and de', () => expect(Object.keys(locales).sort()).toEqual(expect.arrayContaining(['de', 'en'])))
  for (const [code, msgs] of Object.entries(locales)) {
    if (code === 'en') continue
    it(`${code}: same keys as en`, () => {
      expect(Object.keys(msgs).filter((k) => !(k in en))).toEqual([])
      expect(Object.keys(en).filter((k) => !(k in msgs))).toEqual([])
    })
    it(`${code}: same placeholders and plural forms as en`, () => {
      const bad = Object.keys(en).filter(
        (k) =>
          msgs[k] !== undefined &&
          (placeholders(en[k]) !== placeholders(msgs[k]) || branches(en[k]) !== branches(msgs[k])),
      )
      expect(bad).toEqual([])
    })
    it(`${code}: no empty messages`, () => expect(Object.keys(msgs).filter((k) => !msgs[k].trim())).toEqual([]))
  }
  it('every key used in code exists in en', () => expect([...usedStatic].filter((k) => !(k in en))).toEqual([]))
  it('every message in en is used (statically or via a dynamic prefix)', () => {
    const unused = Object.keys(en).filter(
      (k) => !usedStatic.has(k) && !quoted.has(k) && !usedDynamicPrefixes.some((p) => k.startsWith(p)),
    )
    expect(unused).toEqual([])
  })
})
