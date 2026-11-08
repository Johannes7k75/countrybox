/**
 * Exports model-ready renderings for an offline embedding job (step 4, see EMBEDDINGS.md).
 * Each flag is rendered aspect-preserving (4:3 → 224×168) and centred on a white 224×224 canvas.
 * Output: data/similarity/renders/<catalogVersion>/<id>.png + manifest.json (sha256 per file, flagKey groups).
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Catalog } from '@countrybox/catalog'
import { Resvg } from '@resvg/resvg-js'

const SIZE = 224
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const catalog = JSON.parse(readFileSync(join(root, 'packages/catalog/generated/countries.json'), 'utf8')) as Catalog
const out = join(root, 'data/similarity/renders', catalog.version)
mkdirSync(out, { recursive: true })
const files: Record<string, { file: string; sha256: string; flagKey: string }> = {}
for (const c of catalog.countries) {
  const svg = readFileSync(join(root, 'apps/web/public/catalog/flags', `${c.id}.svg`), 'utf8')
  // Wrap the flag in a square white canvas so models with square inputs see the whole, undistorted flag.
  const inner = new Resvg(svg, { fitTo: { mode: 'width', value: SIZE }, background: 'white' }).render()
  const pad = (SIZE - inner.height) / 2
  const wrapper = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><rect width="100%" height="100%" fill="#fff"/><image x="0" y="${pad}" width="${inner.width}" height="${inner.height}" href="data:image/png;base64,${Buffer.from(inner.asPng()).toString('base64')}"/></svg>`
  const png = new Resvg(wrapper, { fitTo: { mode: 'original' } }).render().asPng()
  writeFileSync(join(out, `${c.id}.png`), png)
  files[c.id] = { file: `${c.id}.png`, sha256: createHash('sha256').update(png).digest('hex'), flagKey: c.flagKey }
}
writeFileSync(
  join(out, 'manifest.json'),
  JSON.stringify(
    { catalogVersion: catalog.version, size: SIZE, recipe: 'resvg-fit-width-224-centre-white-v1', files },
    null,
    2,
  ),
)
console.log(`exported ${Object.keys(files).length} renders → ${out}`)
