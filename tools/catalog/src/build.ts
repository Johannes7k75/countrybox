/**
 * Deterministic catalog build.
 * Inputs : data/legacy/countries.json + data/legacy/geojson (provenance NOT cleared — seed only),
 *          data/overrides/*.json (reviewed), CLDR display names via Intl (ICU), flag-icons (MIT).
 * Outputs: packages/catalog/generated/{countries.json,world.json,manifest.json}
 *          apps/web/public/catalog/{countries.json,world.json,manifest.json,NOTICE.txt,flags/*.svg}
 */
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { REGIONS, type Catalog, type CatalogCountry, type Region, type WorldMap } from '@countrybox/catalog'
import { IDENTICAL_THRESHOLD, flagFeatures, plainDistance } from '@countrybox/similarity-tool/features'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const p = (...s: string[]) => join(root, ...s)
const readJson = <T>(f: string): T => JSON.parse(readFileSync(f, 'utf8')) as T

interface LegacyCountry {
  name: string
  cca3: string
  cca2: string
  capital?: string
  independent: boolean
  region: string
  subregion: string
  tlds: string[]
  callingCode: string | null
  unMember: boolean
}
type Pt = [number, number]

const legacy = readJson<LegacyCountry[]>(p('data/legacy/countries.json'))
const capOverrides = readJson<Record<string, { en?: string[]; de?: string[]; reason: string }>>(
  p('data/overrides/capitals.json'),
)
const factOverrides = readJson<
  Record<string, Partial<Pick<CatalogCountry, 'un' | 'independent'>> & { reason: string }>
>(p('data/overrides/facts.json'))
const geonames = readJson<{ capitals: Record<string, { lat: number; lon: number }> }>(
  p('data/sources/geonames/capitals.json'),
).capitals
const capitalPosOverrides = readJson<Record<string, { pos: [number, number]; reason: string }>>(
  p('data/overrides/capital-positions.json'),
)
const deCapitals = readJson<Record<string, string>>(p('data/overrides/capitals.de.json'))
const enNames = new Intl.DisplayNames(['en'], { type: 'region' })
const deNames = new Intl.DisplayNames(['de'], { type: 'region' })

/* ── geometry ── */
const W = 1000,
  LAT0 = 84,
  LAT1 = -58
const H = +((W * (LAT0 - LAT1)) / 360).toFixed(1)
const proj = ([lon, lat]: Pt): Pt => [((lon + 180) / 360) * W, ((LAT0 - lat) / (LAT0 - LAT1)) * H]
const area = (r: Pt[]) => {
  let a = 0
  for (let i = 0; i < r.length; i++) {
    const [x1, y1] = r[i]!,
      [x2, y2] = r[(i + 1) % r.length]!
    a += x1 * y2 - x2 * y1
  }
  return Math.abs(a / 2)
}
function centroid(ring: Pt[]): Pt {
  // lon/lat polygon centroid
  let a = 0,
    cx = 0,
    cy = 0
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i]!,
      [x2, y2] = ring[(i + 1) % ring.length]!
    const f = x1 * y2 - x2 * y1
    a += f
    cx += (x1 + x2) * f
    cy += (y1 + y2) * f
  }
  if (Math.abs(a) < 1e-9) return ring[0]!
  return [cx / (3 * a), cy / (3 * a)]
}
const world: WorldMap = { w: W, h: H, lat0: LAT0, lat1: LAT1, paths: {}, boxes: {} }
const centers: Record<string, [number, number]> = {}
const geoDir = p('data/legacy/geojson')
for (const f of readdirSync(geoDir).sort()) {
  const id = f.slice(0, 2).toLowerCase()
  if (id === 'aq') continue
  const g = readJson<{ geometry?: { type: string; coordinates: unknown } }>(join(geoDir, f)).geometry
  if (!g) continue
  const polys = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as Pt[][][]
  let best: Pt[] | null = null,
    bestRaw: Pt[] | null = null,
    bestA = -1
  const rings: [Pt[], number][] = []
  for (const poly of polys) {
    const raw = poly[0]!
    const ring = raw.map(proj)
    const a = area(ring)
    rings.push([ring, a])
    if (a > bestA) {
      bestA = a
      best = ring
      bestRaw = raw
    }
  }
  let d = ''
  for (const [ring, a] of rings) {
    if (a < 0.5 && ring !== best) continue
    const kept: Pt[] = []
    let last: Pt | null = null
    for (const pt of ring)
      if (!last || Math.hypot(pt[0] - last[0], pt[1] - last[1]) > 1.3) {
        kept.push(pt)
        last = pt
      }
    if (kept.length < 3) continue
    d += 'M' + kept.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('L') + 'Z'
  }
  if (!d || !best || !bestRaw) continue
  world.paths[id] = d
  const xs = best.map((q) => q[0]),
    ys = best.map((q) => q[1])
  world.boxes[id] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map((v) => +v.toFixed(1)) as [
    number,
    number,
    number,
    number,
  ]
  const [lon, lat] = centroid(bestRaw)
  centers[id] = [+lat.toFixed(2), +lon.toFixed(2)]
}

/* ── facts ── */
const req = createRequire(import.meta.url)
const flagDir = join(dirname(req.resolve('flag-icons/package.json')), 'flags/4x3')
const flagKeyOf = (id: string) =>
  createHash('sha256')
    .update(
      readFileSync(join(flagDir, `${id}.svg`), 'utf8')
        .replace(/\s+/g, ' ')
        .replace(/ id="[^"]*"/g, ''),
    )
    .digest('hex')
    .slice(0, 12)

const errors: string[] = []
const countries: CatalogCountry[] = []
for (const c of [...legacy].sort((a, b) => a.cca2.localeCompare(b.cca2))) {
  if (!REGIONS.includes(c.region as Region)) continue // Antarctic entries are out of scope
  const id = c.cca2.toLowerCase()
  const ov = capOverrides[c.cca2]
  const capsEn = ov?.en ?? (c.capital ? [c.capital] : [])
  const capsDe = ov?.de ?? capsEn.map((x) => deCapitals[x] ?? x)
  const en = enNames.of(c.cca2) ?? c.name
  const de = deNames.of(c.cca2) ?? c.name
  if (!en || en === c.cca2) errors.push(`${c.cca2}: missing English name`)
  if (!existsSync(join(flagDir, `${id}.svg`))) errors.push(`${c.cca2}: missing flag`)
  countries.push({
    id,
    iso3: c.cca3,
    name: { en, de },
    capitals: { en: capsEn, de: capsDe },
    region: c.region as Region,
    subregion: c.subregion,
    tlds: [...c.tlds].sort(),
    callingCodes: c.callingCode ? [c.callingCode] : [],
    un: c.unMember,
    independent: c.independent,
    flagKey: flagKeyOf(id),
    center: centers[id] ?? null,
    map: !!world.paths[id],
    capitalPos: capsEn.length
      ? (capitalPosOverrides[id]?.pos ?? (geonames[id] ? [geonames[id].lat, geonames[id].lon] : null))
      : null,
  })
  const fo = factOverrides[c.cca2]
  if (fo) {
    const last = countries[countries.length - 1]!
    if (fo.un !== undefined) last.un = fo.un
    if (fo.independent !== undefined) last.independent = fo.independent
  }
}
for (const id of Object.keys(world.paths))
  if (!countries.some((c) => c.id === id)) {
    delete world.paths[id]
    delete world.boxes[id]
  }
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

/* Visual identity: flags that RENDER the same share a flagKey, even when their SVG sources differ
   (France vs. its overseas territories, Netherlands vs. Bonaire). Union-find over plain (unmirrored) distance. */
{
  const feats = countries.map((c) => flagFeatures(c.id, readFileSync(join(flagDir, `${c.id}.svg`), 'utf8')))
  const parent = countries.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)))
  for (let i = 0; i < feats.length; i++)
    for (let j = i + 1; j < feats.length; j++) {
      if (countries[i]!.flagKey === countries[j]!.flagKey || plainDistance(feats[i]!, feats[j]!) < IDENTICAL_THRESHOLD)
        parent[find(i)] = find(j)
    }
  const groups = new Map<number, CatalogCountry[]>()
  countries.forEach((c, i) => {
    const r = find(i)
    groups.set(r, [...(groups.get(r) ?? []), c])
  })
  for (const members of groups.values()) {
    const key = createHash('sha256')
      .update(
        members
          .map((m) => m.flagKey)
          .sort()
          .join('|'),
      )
      .digest('hex')
      .slice(0, 12)
    for (const m of members) m.flagKey = key
    if (members.length > 1) console.log(`identical flags: ${members.map((m) => m.id).join(' ')}`)
  }
}

const factsJson = JSON.stringify(countries)
const version = createHash('sha256').update(factsJson).digest('hex').slice(0, 16)
const catalog: Catalog = { schemaVersion: 1, version, countries }

/* ── write ── */
const pkgOut = p('packages/catalog/generated')
const webOut = p('apps/web/public/catalog')
rmSync(pkgOut, { recursive: true, force: true })
rmSync(webOut, { recursive: true, force: true })
mkdirSync(pkgOut, { recursive: true })
mkdirSync(join(webOut, 'flags'), { recursive: true })
const flagLicense = join(dirname(req.resolve('flag-icons/package.json')), 'LICENSE')
for (const c of countries) {
  const svg = readFileSync(join(flagDir, `${c.id}.svg`), 'utf8')
  if (/<script|foreignObject|\son\w+=|href="http/i.test(svg)) {
    console.error(`unsafe flag svg: ${c.id}`)
    process.exit(1)
  }
  copyFileSync(join(flagDir, `${c.id}.svg`), join(webOut, 'flags', `${c.id}.svg`))
}
const worldJson = JSON.stringify(world)
const sha = (s: string) => createHash('sha256').update(s).digest('hex')
const manifest = {
  schemaVersion: 1,
  catalogVersion: version,
  scopePolicyVersion: 'countrybox-scope-v1',
  boundaryPolicy: 'legacy-geojson-uncleared',
  sources: [
    {
      id: 'legacy-countries',
      path: 'data/legacy/countries.json',
      license: 'UNCLEARED — seed only',
      sha256: sha(readFileSync(p('data/legacy/countries.json'), 'utf8')),
    },
    {
      id: 'cldr-via-icu',
      revision: `node ${process.versions.node} / icu ${process.versions.icu} / cldr ${process.versions.cldr}`,
      license: 'Unicode-3.0',
    },
    { id: 'flag-icons', revision: req('flag-icons/package.json').version as string, license: 'MIT' },
    { id: 'legacy-geojson', path: 'data/legacy/geojson', license: 'UNCLEARED — seed only' },
    { id: 'geonames-capitals', path: 'data/sources/geonames/capitals.json', license: 'CC BY 4.0' },
    { id: 'overrides', path: 'data/overrides', license: 'project' },
  ],
  artifacts: [
    { path: 'countries.json', sha256: sha(JSON.stringify(catalog)), bytes: Buffer.byteLength(JSON.stringify(catalog)) },
    { path: 'world.json', sha256: sha(worldJson), bytes: Buffer.byteLength(worldJson) },
  ],
}
for (const out of [pkgOut, webOut]) {
  writeFileSync(join(out, 'countries.json'), JSON.stringify(catalog))
  writeFileSync(join(out, 'world.json'), worldJson)
  writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2))
}
writeFileSync(
  join(webOut, 'NOTICE.txt'),
  [
    'CountryBox catalog notices',
    '',
    'Flags: flag-icons (https://github.com/lipis/flag-icons), MIT License:',
    readFileSync(flagLicense, 'utf8'),
    'Country display names: Unicode CLDR via ICU, Unicode License v3.',
    'Capital coordinates: GeoNames (https://www.geonames.org/), CC BY 4.0, with reviewed overrides in data/overrides/capital-positions.json.',
    'Facts and geometry: legacy CountryBox seed data; provenance not yet cleared for production.',
  ].join('\n'),
)
console.log(
  `catalog ${version}: ${countries.length} countries, ${Object.keys(world.paths).length} map paths, world ${(worldJson.length / 1024).toFixed(0)} KB`,
)
