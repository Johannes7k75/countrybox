import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import type { Catalog, NeighborPack } from '@countrybox/catalog'
import { describe, expect, it } from 'vitest'

import { evaluate, type Fixtures } from '../src/rank'

const read = <T>(rel: string) => JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')) as T
// Run `pnpm --filter @countrybox/similarity-tool build` first (it regenerates the pack).
const pack = read<NeighborPack>('../../../packages/catalog/generated/flag-neighbors.json')
const catalog = read<Catalog>('../../../packages/catalog/generated/countries.json')
const fixtures = read<Fixtures>('../../../data/similarity/fixtures.json')

describe('neighbour pack', () => {
  it('matches the current catalog and is well formed', () => {
    expect(pack.catalogVersion).toBe(catalog.version)
    const ids = new Set(catalog.countries.map((c) => c.id))
    const key = new Map(catalog.countries.map((c) => [c.id, c.flagKey]))
    for (const [id, list] of Object.entries(pack.neighbors)) {
      expect(ids.has(id)).toBe(true)
      expect(list).not.toContain(id)
      expect(new Set(list).size).toBe(list.length)
      for (const n of list) {
        expect(ids.has(n)).toBe(true)
        expect(key.get(n)).not.toBe(key.get(id))
      }
      const d = pack.distances[id]!
      expect(d.every((x, i) => Number.isFinite(x) && (i === 0 || x >= d[i - 1]!))).toBe(true)
    }
  })
  it('passes the required look-alike and distinct fixtures', () => {
    const r = evaluate(pack, fixtures)
    expect(r.lookalike.filter((x) => x.required && !x.pass)).toEqual([])
    expect(r.distinct.filter((x) => !x.pass)).toEqual([])
  })
})
