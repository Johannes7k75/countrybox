import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Catalog, NeighborPack } from '@countrybox/catalog'

import { METHOD, distance, flagFeatures, type FlagFeatures } from './features'

export const K = 24

/** Exhaustive pairwise ranking (≈30k pairs). Identical artwork (same flagKey) is excluded: it can never be a fair distractor. */
export function buildPack(catalog: Catalog, flagDir: string): { pack: NeighborPack; features: FlagFeatures[] } {
  const features = catalog.countries.map((c) => flagFeatures(c.id, readFileSync(join(flagDir, `${c.id}.svg`), 'utf8')))
  const key = new Map(catalog.countries.map((c) => [c.id, c.flagKey]))
  const neighbors: Record<string, string[]> = {},
    distances: Record<string, number[]> = {}
  for (const a of features) {
    const ranked = features
      .filter((b) => b.id !== a.id && key.get(b.id) !== key.get(a.id))
      .map((b) => ({ id: b.id, d: distance(a, b) }))
      .sort((x, y) => x.d - y.d || x.id.localeCompare(y.id))
      .slice(0, K)
    neighbors[a.id] = ranked.map((r) => r.id)
    distances[a.id] = ranked.map((r) => +r.d.toFixed(2))
  }
  const body = { method: METHOD, catalogVersion: catalog.version, k: K, neighbors, distances }
  const version = createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 16)
  return { pack: { schemaVersion: 1, version, ...body }, features }
}

export interface Fixtures {
  nearBand: number
  lookalike: { a: string; b: string; required: boolean; why: string }[]
  distinct: { a: string; b: string }[]
}
export interface EvalRow {
  a: string
  b: string
  rank: number | null
  required?: boolean
  pass: boolean
}

/** rank = best of (b's rank in a's list, a's rank in b's list), 1-based; null = not in top-k. */
export function evaluate(pack: NeighborPack, fx: Fixtures) {
  const rankOf = (a: string, b: string) => {
    const r1 = pack.neighbors[a]?.indexOf(b) ?? -1,
      r2 = pack.neighbors[b]?.indexOf(a) ?? -1
    const r = [r1, r2].filter((x) => x >= 0)
    return r.length ? Math.min(...r) + 1 : null
  }
  const lookalike: EvalRow[] = fx.lookalike.map((p) => {
    const rank = rankOf(p.a, p.b)
    return { a: p.a, b: p.b, rank, required: p.required, pass: rank !== null && rank <= fx.nearBand }
  })
  // Distinct pairs must stay out of the near band (the tier hard mode samples first); mid-band appearances are reported.
  const distinct: EvalRow[] = fx.distinct.map((p) => {
    const rank = rankOf(p.a, p.b)
    return { a: p.a, b: p.b, rank, required: true, pass: rank === null || rank > fx.nearBand }
  })
  const recall = lookalike.filter((r) => r.pass).length / Math.max(1, lookalike.length)
  return { lookalike, distinct, recallAtNear: +recall.toFixed(3) }
}
