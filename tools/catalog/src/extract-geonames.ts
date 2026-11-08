/**
 * One-off extract of capital coordinates from a GeoNames dump (CC BY 4.0).
 * Usage: tsx src/extract-geonames.ts <path/to/cities500.txt> <sha256-of-zip>
 * Writes data/sources/geonames/capitals.json (committed). Re-run only when refreshing the source.
 * Matching: GeoNames rows with feature code PPLC (capital) or PPLG (seat of government) per ISO country code;
 * when a country has several, prefer the one whose name/alternate names match the catalog's first capital.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Catalog } from '@countrybox/catalog'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const [file, sha] = process.argv.slice(2)
if (!file || !sha) {
  console.error('usage: extract-geonames <cities500.txt> <zip-sha256>')
  process.exit(2)
}
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
interface Row {
  id: number
  name: string
  names: Set<string>
  lat: number
  lon: number
  code: string
  cc: string
  pop: number
}
const rows: Row[] = []
for (const line of readFileSync(file, 'utf8').split('\n')) {
  const f = line.split('\t')
  if (f.length < 15 || (f[7] !== 'PPLC' && f[7] !== 'PPLG')) continue
  rows.push({
    id: +f[0]!,
    name: f[1]!,
    names: new Set([f[1]!, f[2]!, ...f[3]!.split(',')].filter(Boolean).map(norm)),
    lat: +f[4]!,
    lon: +f[5]!,
    code: f[7],
    cc: f[8]!.toLowerCase(),
    pop: +f[14]!,
  })
}
const catalog = JSON.parse(readFileSync(join(root, 'packages/catalog/generated/countries.json'), 'utf8')) as Catalog
const out: Record<string, { name: string; lat: number; lon: number; geonameId: number; featureCode: string }> = {}
const missing: string[] = [],
  mismatched: string[] = []
for (const c of catalog.countries) {
  const cand = rows.filter((r) => r.cc === c.id)
  if (!cand.length) {
    missing.push(c.id)
    continue
  }
  const want = c.capitals.en.map(norm)
  const match = cand.find((r) => want.some((w) => r.names.has(w)))
  const pick =
    match ?? [...cand].sort((a, b) => (a.code === 'PPLC' ? -1 : 1) - (b.code === 'PPLC' ? -1 : 1) || b.pop - a.pop)[0]!
  if (!match && c.capitals.en.length)
    mismatched.push(`${c.id}: catalog "${c.capitals.en[0]}" → GeoNames "${pick.name}"`)
  out[c.id] = {
    name: pick.name,
    lat: +pick.lat.toFixed(4),
    lon: +pick.lon.toFixed(4),
    geonameId: pick.id,
    featureCode: pick.code,
  }
}
writeFileSync(
  join(root, 'data/sources/geonames/capitals.json'),
  JSON.stringify(
    {
      $source: {
        name: 'GeoNames cities500',
        url: 'https://download.geonames.org/export/dump/cities500.zip',
        license: 'CC BY 4.0 (https://www.geonames.org/)',
        retrievedAt: new Date().toISOString().slice(0, 10),
        sha256: sha,
      },
      capitals: Object.fromEntries(Object.entries(out).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
    },
    null,
    1,
  ) + '\n',
)
console.log(`${Object.keys(out).length} capitals; missing ${missing.length}: ${missing.join(' ')}`)
if (mismatched.length) console.log(`name mismatches (${mismatched.length}) — review:\n  ${mismatched.join('\n  ')}`)
