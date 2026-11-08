/**
 * Builds the visual neighbour pack from the generated catalog.
 * Production method (decided 2026-11-07, see EMBEDDINGS.md): fused-labgrid-openclip-v3 =
 *   lab-grid-v1 (computed here) ⊕ OpenCLIP image embeddings (committed artifact from embed.py), reciprocal rank fusion.
 * If the committed OpenCLIP pack was built for another catalog version, the build falls back to lab-grid-v1 and warns.
 * Inputs : packages/catalog/generated/countries.json, apps/web/public/catalog/flags/*.svg (run `pnpm catalog` first)
 * Outputs: packages/catalog/generated/flag-neighbors.json, apps/web/public/catalog/flag-neighbors.json,
 *          data/similarity/report-<method>.json (evaluation against data/similarity/fixtures.json)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Catalog } from '@countrybox/catalog'
import type { NeighborPack } from '@countrybox/catalog'

import { fuse } from './fuse'
import { buildPack, evaluate, type Fixtures } from './rank'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const catalog = JSON.parse(readFileSync(join(root, 'packages/catalog/generated/countries.json'), 'utf8')) as Catalog
const fixtures = JSON.parse(readFileSync(join(root, 'data/similarity/fixtures.json'), 'utf8')) as Fixtures
const t0 = Date.now()
const { pack: lab } = buildPack(catalog, join(root, 'apps/web/public/catalog/flags'))
writeFileSync(
  join(root, `data/similarity/report-${lab.method}.json`),
  JSON.stringify(
    { method: lab.method, packVersion: lab.version, catalogVersion: lab.catalogVersion, ...evaluate(lab, fixtures) },
    null,
    2,
  ) + '\n',
)

export const CLIP_PACK = 'data/similarity/flag-neighbors.openclip-vitb32-laion2b-v1.json'
let pack: NeighborPack = lab
const clipPath = join(root, CLIP_PACK)
if (existsSync(clipPath)) {
  const clip = JSON.parse(readFileSync(clipPath, 'utf8')) as NeighborPack
  if (clip.catalogVersion === catalog.version) pack = fuse([lab, clip], 'fused-labgrid-openclip-v3', 24, true)
  else
    console.warn(
      `⚠ ${CLIP_PACK} was built for catalog ${clip.catalogVersion}, current is ${catalog.version} — publishing lab-grid-v1 only. Re-run embed.py (see EMBEDDINGS.md).`,
    )
} else console.warn(`⚠ ${CLIP_PACK} missing — publishing lab-grid-v1 only.`)
const report = {
  method: pack.method,
  packVersion: pack.version,
  catalogVersion: pack.catalogVersion,
  ...evaluate(pack, fixtures),
}
const json = JSON.stringify(pack)
for (const out of ['packages/catalog/generated', 'apps/web/public/catalog']) {
  mkdirSync(join(root, out), { recursive: true })
  writeFileSync(join(root, out, 'flag-neighbors.json'), json)
}
writeFileSync(join(root, `data/similarity/report-${pack.method}.json`), JSON.stringify(report, null, 2) + '\n')

const fmt = (r: { a: string; b: string; rank: number | null; pass: boolean; required?: boolean }) =>
  `  ${r.pass ? '✓' : r.required ? '✗' : '·'} ${r.a}–${r.b}  rank ${r.rank ?? '>' + pack.k}${r.required ? '' : '  (reported only)'}`
console.log(
  `${pack.method} pack ${pack.version}: ${Object.keys(pack.neighbors).length} flags, k=${pack.k}, ${(json.length / 1024).toFixed(0)} KB, ${Date.now() - t0} ms`,
)
console.log(
  `look-alikes (near band ≤ ${fixtures.nearBand}), recall ${report.recallAtNear}:\n${report.lookalike.map(fmt).join('\n')}`,
)
console.log(
  `distinct pairs (must stay out of the near band ≤ ${fixtures.nearBand}):\n${report.distinct.map((r) => fmt(r).replace('  (reported only)', '')).join('\n')}`,
)
const failed =
  report.lookalike.filter((r) => r.required && !r.pass).length + report.distinct.filter((r) => !r.pass).length
if (failed) {
  console.error(`${failed} required fixture(s) failed`)
  process.exitCode = 1
}
