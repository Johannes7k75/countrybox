import type { CatalogCountry, NeighborPack } from '@countrybox/catalog'

import { parseDirection, type Direction } from './fields'
import { shuffle, type Rng } from './rng'

/**
 * Distractor strategies decide WHICH plausible wrong answers are tried first.
 * They never decide correctness: buildFromTiers() still enforces one unambiguous answer.
 *   random-v1  shuffled session pool, then the whole catalog (default for normal sessions)
 *   region-v1  same subregion → same region → pool → catalog (tiny pools, hard non-flag questions)
 *   visual-v1  visually similar flags from a NeighborPack (hard flag questions), then region-v1 tiers
 */
export const STRATEGY_IDS = ['random-v1', 'region-v1', 'visual-v1'] as const
export type StrategyId = (typeof STRATEGY_IDS)[number]
export const DIFFICULTIES = ['standard', 'hard'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export interface DistractorContext {
  /** Eligible entities of the session pool. */
  pool: readonly CatalogCountry[]
  /** Every eligible entity for this direction. */
  global: readonly CatalogCountry[]
  rng: Rng
  neighbors?: NeighborPack | null
}
export interface DistractorStrategy {
  id: StrategyId
  tiers(target: CatalogCountry, direction: Direction, ctx: DistractorContext): CatalogCountry[][]
}

export const randomV1: DistractorStrategy = {
  id: 'random-v1',
  tiers: (_t, _d, { pool, global, rng }) => [shuffle(pool, rng), shuffle(global, rng)],
}

export const regionV1: DistractorStrategy = {
  id: 'region-v1',
  tiers: (t, _d, { pool, global, rng }) => [
    shuffle(
      global.filter((c) => c.subregion === t.subregion),
      rng,
    ),
    shuffle(
      global.filter((c) => c.region === t.region && c.subregion !== t.subregion),
      rng,
    ),
    shuffle(pool, rng),
    shuffle(global, rng),
  ],
}

/** Size of the closest band sampled in hard mode; sampling (not always the top 3) keeps questions varied. */
export const VISUAL_NEAR_BAND = 8
export const VISUAL_MID_BAND = 20

export const visualV1: DistractorStrategy = {
  id: 'visual-v1',
  tiers(t, d, ctx) {
    const ranked = ctx.neighbors?.neighbors[t.id] ?? []
    const byId = new Map(ctx.global.map((c) => [c.id, c]))
    const near = ranked.map((id) => byId.get(id)).filter((c): c is CatalogCountry => !!c)
    // Prefer look-alikes inside the learner's scope (e.g. UN members); outside ones only as a fallback.
    const inPool = new Set(ctx.pool.map((c) => c.id))
    const inside = ctx.pool.length >= 8 ? near.filter((c) => inPool.has(c.id)) : near
    const outside = near.filter((c) => !inside.includes(c))
    return [
      shuffle(inside.slice(0, VISUAL_NEAR_BAND), ctx.rng),
      shuffle(inside.slice(VISUAL_NEAR_BAND, VISUAL_MID_BAND), ctx.rng),
      shuffle(outside.slice(0, VISUAL_NEAR_BAND), ctx.rng),
      ...regionV1.tiers(t, d, ctx),
    ]
  },
}

export const STRATEGIES: Record<StrategyId, DistractorStrategy> = {
  'random-v1': randomV1,
  'region-v1': regionV1,
  'visual-v1': visualV1,
}

export const directionHasFlag = (d: Direction) => {
  const p = parseDirection(d)
  return !!p && (p[0] === 'flag' || p[1] === 'flag')
}

/**
 * Policy: map prompt → region-v1; hard + flag question + neighbour pack → visual-v1; hard otherwise → region-v1;
 * standard → region-v1 for tiny pools (so a one-country drill is not trivial), else random-v1.
 */
export function chooseStrategy(
  direction: Direction,
  difficulty: Difficulty,
  poolSize: number,
  neighbors?: NeighborPack | null,
): DistractorStrategy {
  // On a map the meaningful confusions are neighbours, so map prompts always draw distractors from the region.
  if (direction.startsWith('location-')) return regionV1
  if (difficulty === 'hard') return directionHasFlag(direction) && neighbors ? visualV1 : regionV1
  return poolSize < 8 ? regionV1 : randomV1
}
