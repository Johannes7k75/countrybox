import type { CatalogCountry, Region } from '@countrybox/catalog'

import { fieldKeys, hasField, overlaps, parseDirection, type Direction, type Field } from './fields'
import { shuffle, type Rng } from './rng'

export const OPTION_COUNT = 4

export type Scope = 'un' | 'all'
export interface PoolFilter {
  scope: Scope
  region: Region | 'world'
}

export function inScope(c: CatalogCountry, f: PoolFilter): boolean {
  return (f.scope === 'all' || c.un) && (f.region === 'world' || c.region === f.region)
}

/** Entities that can be asked in this direction (both fields known). */
export function eligible(countries: readonly CatalogCountry[], direction: Direction): CatalogCountry[] {
  const pair = parseDirection(direction)
  if (!pair) return []
  return countries.filter((c) => hasField(c, pair[0]) && hasField(c, pair[1]))
}

export interface Question {
  targetId: string
  optionIds: string[]
}

/**
 * Picks distractors so that exactly one displayed option is correct:
 *  - a distractor never shares a prompt value with the target (else the prompt would fit it too),
 *  - no two options share an answer value (else two options would look identical / both be right).
 * `tiers` come from a DistractorStrategy, best candidates first; each tier is consumed in the given order.
 */
export function buildFromTiers(
  target: CatalogCountry,
  direction: Direction,
  tiers: readonly (readonly CatalogCountry[])[],
  rng: Rng,
): Question | null {
  const pair = parseDirection(direction)
  if (!pair) return null
  const [prompt, answer] = pair
  // Click questions have no options: the learner clicks the map (see acceptedIds for what counts as correct).
  if (answer === 'location') return hasField(target, 'location') ? { targetId: target.id, optionIds: [] } : null
  const tPrompt = fieldKeys(target, prompt)
  const chosen: CatalogCountry[] = [target]
  const usedAnswers = [...fieldKeys(target, answer)]
  for (const tier of tiers)
    for (const c of tier) {
      if (chosen.length >= OPTION_COUNT) break
      if (chosen.some((x) => x.id === c.id)) continue
      if (!hasField(c, answer) || !hasField(c, prompt)) continue
      if (overlaps(fieldKeys(c, prompt), tPrompt)) continue
      const keys = fieldKeys(c, answer)
      if (overlaps(keys, usedAnswers)) continue
      chosen.push(c)
      usedAnswers.push(...keys)
    }
  if (chosen.length < OPTION_COUNT) return null
  return { targetId: target.id, optionIds: shuffle(chosen, rng).map((c) => c.id) }
}

/** random-v1 convenience: pool candidates first, then the whole catalog (both shuffled). */
export function buildQuestion(
  target: CatalogCountry,
  direction: Direction,
  poolCandidates: readonly CatalogCountry[],
  globalCandidates: readonly CatalogCountry[],
  rng: Rng,
): Question | null {
  return buildFromTiers(target, direction, [shuffle(poolCandidates, rng), shuffle(globalCandidates, rng)], rng)
}

/** Checks the invariant used by tests and by the API before accepting a question. */
export function isUnambiguous(q: Question, direction: Direction, byId: ReadonlyMap<string, CatalogCountry>): boolean {
  const pair = parseDirection(direction)
  if (pair?.[1] === 'location') return q.optionIds.length === 0 && byId.has(q.targetId)
  if (!pair || q.optionIds.length !== OPTION_COUNT || new Set(q.optionIds).size !== OPTION_COUNT) return false
  const [prompt, answer] = pair
  const target = byId.get(q.targetId)
  if (!target || !q.optionIds.includes(q.targetId)) return false
  const opts = q.optionIds.map((id) => byId.get(id))
  if (opts.some((o) => !o)) return false
  const matchesPrompt = opts.filter((o) => overlaps(fieldKeys(o!, prompt), fieldKeys(target, prompt)))
  if (matchesPrompt.length !== 1) return false
  for (let i = 0; i < opts.length; i++)
    for (let j = i + 1; j < opts.length; j++) {
      if (overlaps(fieldKeys(opts[i]!, answer), fieldKeys(opts[j]!, answer))) return false
    }
  return true
}

export type { Field }

/**
 * For click questions: every mapped entity that matches the prompt is a correct click
 * (e.g. "+1" accepts the USA and Canada; France's flag also accepts territories using the same flag).
 */
export function acceptedIds(
  target: CatalogCountry,
  direction: Direction,
  countries: readonly CatalogCountry[],
): string[] {
  const pair = parseDirection(direction)
  if (!pair || pair[1] !== 'location') return [target.id]
  const keys = fieldKeys(target, pair[0])
  return countries
    .filter((c) => hasField(c, 'location') && (c.id === target.id || overlaps(fieldKeys(c, pair[0]), keys)))
    .map((c) => c.id)
}
