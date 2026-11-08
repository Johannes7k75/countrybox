/**
 * Scores any neighbour pack against data/similarity/fixtures.json and compares it with the current baseline.
 * Usage: pnpm --filter @countrybox/similarity-tool evaluate <path/to/pack.json>
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Catalog, NeighborPack } from '@countrybox/catalog'

import { evaluate, type Fixtures } from './rank'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const path = process.argv[2]
if (!path) {
  console.error('usage: evaluate <pack.json>')
  process.exit(2)
}
const pack = JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8')) as NeighborPack
const catalog = JSON.parse(readFileSync(join(root, 'packages/catalog/generated/countries.json'), 'utf8')) as Catalog
const fixtures = JSON.parse(readFileSync(join(root, 'data/similarity/fixtures.json'), 'utf8')) as Fixtures

const problems: string[] = []
if (pack.schemaVersion !== 1) problems.push('schemaVersion must be 1')
if (pack.catalogVersion !== catalog.version)
  problems.push(`catalogVersion ${pack.catalogVersion} ≠ current ${catalog.version}`)
const key = new Map(catalog.countries.map((c) => [c.id, c.flagKey]))
for (const c of catalog.countries) if (!pack.neighbors[c.id]) problems.push(`missing neighbours for ${c.id}`)
for (const [id, list] of Object.entries(pack.neighbors))
  for (const n of list) {
    if (n === id) problems.push(`${id} lists itself`)
    else if (!key.has(n)) problems.push(`${id} → unknown ${n}`)
    else if (key.get(n) === key.get(id)) problems.push(`${id} → ${n} is a visually identical flag (must be excluded)`)
  }

const r = evaluate(pack, fixtures)
const baseline = (() => {
  try {
    return JSON.parse(readFileSync(join(root, 'data/similarity/report-lab-grid-v1.json'), 'utf8')) as ReturnType<
      typeof evaluate
    >
  } catch {
    return null
  }
})()
console.log(
  `${pack.method} (${pack.version}) — look-alike recall@${fixtures.nearBand}: ${r.recallAtNear}${baseline ? `  | baseline lab-grid-v1: ${baseline.recallAtNear}` : ''}`,
)
for (const row of r.lookalike) {
  const b = baseline?.lookalike.find((x) => x.a === row.a && x.b === row.b)
  console.log(
    `  ${row.pass ? '✓' : row.required ? '✗' : '·'} ${row.a}–${row.b}  rank ${row.rank ?? '>' + pack.k}${b ? `  (baseline ${b.rank ?? '>24'})` : ''}`,
  )
}
for (const row of r.distinct)
  console.log(`  ${row.pass ? '✓' : '✗'} distinct ${row.a}–${row.b}  rank ${row.rank ?? '>' + pack.k}`)
writeFileSync(
  join(root, `data/similarity/report-${pack.method}.json`),
  JSON.stringify(
    { method: pack.method, packVersion: pack.version, catalogVersion: pack.catalogVersion, ...r },
    null,
    2,
  ) + '\n',
)
if (problems.length) {
  console.error(`\n${problems.length} structural problem(s):\n  ${problems.slice(0, 20).join('\n  ')}`)
  process.exitCode = 1
}
const failed = r.lookalike.filter((x) => x.required && !x.pass).length + r.distinct.filter((x) => !x.pass).length
if (failed) {
  console.error(`${failed} required fixture(s) failed`)
  process.exitCode = 1
}
