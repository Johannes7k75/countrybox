/**
 * Reciprocal-rank fusion of two or more neighbour packs (same catalog version).
 * score(a→b) = Σ_m 1 / (RRF_K + rank_m(a→b)); ids missing from a pack's top-k count as rank MISSING_FACTOR·k,
 * i.e. "not similar by that signal" — a candidate backed by only one method must be very strong to rank high.
 * Usage: tsx src/fuse.ts [--reciprocal] <out.json> <method-name> <packA.json> <packB.json> [...]
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

import type { NeighborPack } from '@countrybox/catalog'

export const RRF_K = 10
export const MISSING_FACTOR = 2

/**
 * k-reciprocal re-ranking: a candidate b stays in a's ranking only if a also appears in b's top-k for at least one
 * input method. Real look-alikes are mutual; one-sided "conceptual" matches (e.g. CLIP placing the UK near India)
 * are not. Non-reciprocal candidates are moved behind all reciprocal ones (kept, not deleted, as fallback).
 */
export function fuse(packs: NeighborPack[], method: string, k = 24, reciprocal = false): NeighborPack {
  const catalogVersion = packs[0]!.catalogVersion
  if (packs.some((p) => p.catalogVersion !== catalogVersion)) throw new Error('packs built for different catalogs')
  const neighbors: Record<string, string[]> = {},
    distances: Record<string, number[]> = {}
  for (const id of Object.keys(packs[0]!.neighbors)) {
    const score = new Map<string, number>()
    const candidates = new Set(packs.flatMap((p) => p.neighbors[id] ?? []))
    for (const c of candidates) {
      let s = 0
      for (const p of packs) {
        const r = (p.neighbors[id] ?? []).indexOf(c)
        s += 1 / (RRF_K + (r >= 0 ? r + 1 : p.k * MISSING_FACTOR))
      }
      score.set(c, s)
    }
    const mutual = (c: string) => packs.some((p) => (p.neighbors[c] ?? []).includes(id))
    const ranked = [...score]
      .sort(
        (a, b) =>
          (reciprocal ? Number(mutual(b[0])) - Number(mutual(a[0])) : 0) || b[1] - a[1] || a[0].localeCompare(b[0]),
      )
      .slice(0, k)
    neighbors[id] = ranked.map(([c]) => c)
    // store 1 − normalised score as an ascending "distance" (only meaningful within this method)
    const max = packs.length / (RRF_K + 1)
    // running max keeps distances ascending after reciprocal re-ordering (contract: same order as neighbors)
    let prev = 0
    distances[id] = ranked.map(([, s]) => (prev = Math.max(prev, +(1 - s / max).toFixed(4))))
  }
  const body = { method, catalogVersion, k, neighbors, distances }
  return {
    schemaVersion: 1,
    version: createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 16),
    ...body,
  }
}

if (process.argv[1]?.endsWith('fuse.ts')) {
  // CLI only when run directly
  const args = process.argv.slice(2)
  const reciprocal = args[0] === '--reciprocal'
  const [out, method, ...inputs] = reciprocal ? args.slice(1) : args
  if (!out || !method || inputs.length < 2) {
    console.error('usage: fuse <out.json> <method> <packA> <packB> [...]')
    process.exit(2)
  }
  const pack = fuse(
    inputs.map((f) => JSON.parse(readFileSync(f, 'utf8')) as NeighborPack),
    method,
    24,
    reciprocal,
  )
  writeFileSync(out, JSON.stringify(pack))
  console.log(`wrote ${out} (${pack.version}) from ${inputs.length} packs`)
}
