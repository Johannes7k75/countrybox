import type { CatalogCountry, NeighborPack, Region } from '@countrybox/catalog'

import { chooseStrategy, type Difficulty, type StrategyId } from './distractors'
import { parseDirection, type Direction, type MapClickStyle, type MapPromptStyle } from './fields'
import { acceptedIds, buildFromTiers, eligible, inScope, type Question, type Scope } from './questions'
import { createRng, shuffle } from './rng'

export type Mode = 'practice' | 'challenge'
export type MapPolicy = 'off' | 'always' | 'after'
export const CHALLENGE_LIVES = 3
export const SESSION_LENGTHS = [5, 10, 20] as const
export const MAX_SESSION_LENGTH = 100

/** Directions used by a single-country drill: every way the country can be asked, flag first. */
export const DRILL_DIRECTIONS: Direction[] = [
  'flag-name',
  'name-capital',
  'location-name',
  'capital-name',
  'name-flag',
  'name-location',
  'tld-name',
  'callingCode-name',
  'flag-capital',
  'name-tld',
]
/** Wrong clicks allowed in practice before a click question resolves itself. */
export const MAX_CLICK_TRIES = 3

export const reverseDirection = (d: Direction): Direction => {
  const [a, b] = parseDirection(d)!
  return `${b}-${a}`
}

export interface SessionConfig {
  /** Primary direction (the first one when `directions` mixes several). */
  direction: Direction
  /** Optional mix: question i uses directions[i % n] (skipping directions the target does not support). */
  directions?: Direction[]
  scope: Scope
  region: Region | 'world'
  length: number
  mode: Mode
  /** Distractor difficulty; 'hard' prefers visually similar flags. Default 'standard'. */
  difficulty?: Difficulty
  /** Map prompt style (location → …). Default 'outline-capital'. */
  mapPrompt?: MapPromptStyle
  /** Click map style (… → location). Default 'borders'. */
  mapClick?: MapClickStyle
  /** Restrict to these entities (mistakes, single country, review cards). */
  targetIds?: string[]
  kind: 'practice' | 'review'
}

export interface SessionQuestion extends Question {
  /** Direction of this question (older stored sessions lack it → use config.direction). */
  direction?: Direction
  /** Distractor strategy that produced the options (for later analysis). */
  strategy?: StrategyId
  /** Click questions only: every id that counts as a correct click. */
  acceptIds?: string[]
  /** Ordered guesses; the first one decides first-answer accuracy. */
  guesses: string[]
  resolved: boolean
  /** Learner pressed "show answer" in practice. */
  revealed: boolean
  /** Location was visible before answering (map policy "always") — counts as a hint. */
  assisted: boolean
}

export interface Session {
  id: string
  config: SessionConfig
  seed: number
  catalogVersion: string
  /** Neighbour pack used by visual-v1 questions, if any. */
  neighborPackVersion?: string | null
  createdAt: string
  endedAt: string | null
  questions: SessionQuestion[]
  index: number
  status: 'active' | 'finished'
}

export type CreateSessionResult =
  | { ok: true; session: Session }
  | { ok: false; reason: 'insufficient-pool'; eligible: number }

export const configDirections = (c: Pick<SessionConfig, 'direction' | 'directions'>): Direction[] =>
  c.directions?.length ? c.directions : [c.direction]
export const questionDirection = (s: Session, q: SessionQuestion): Direction => q.direction ?? s.config.direction

export function sessionPool(
  countries: readonly CatalogCountry[],
  config: Pick<SessionConfig, 'direction' | 'directions' | 'scope' | 'region' | 'targetIds'>,
) {
  const dirs = configDirections(config)
  const ok = new Set(dirs.flatMap((d) => eligible(countries, d).map((c) => c.id)))
  const all = countries.filter((c) => ok.has(c.id))
  if (config.targetIds?.length) {
    const ids = new Set(config.targetIds)
    return all.filter((c) => ids.has(c.id))
  }
  return all.filter((c) => inScope(c, { scope: config.scope, region: config.region }))
}

export function createSession(
  countries: readonly CatalogCountry[],
  catalogVersion: string,
  config: SessionConfig,
  opts: { id: string; seed: number; now: Date; neighbors?: NeighborPack | null },
): CreateSessionResult {
  const pool = sessionPool(countries, config)
  if (!pool.length) return { ok: false, reason: 'insufficient-pool', eligible: 0 }
  const length = Math.max(1, Math.min(MAX_SESSION_LENGTH, Math.round(config.length)))
  const rng = createRng(opts.seed)
  const dirs = configDirections(config)
  const globals = new Map(dirs.map((d) => [d, eligible(countries, d)]))
  const order: CatalogCountry[] = []
  while (order.length < length) {
    let round = shuffle(pool, rng)
    // avoid the same country twice in a row across round boundaries
    if (round.length > 1 && order.length && round[0]!.id === order[order.length - 1]!.id)
      round = [...round.slice(1), round[0]!]
    order.push(...round)
  }
  const questions: SessionQuestion[] = []
  for (const [i, target] of order.slice(0, length).entries()) {
    // pick the i-th direction this target supports
    for (let k = 0; k < dirs.length; k++) {
      const d = dirs[(i + k) % dirs.length]!
      const global = globals.get(d)!
      if (!global.some((c) => c.id === target.id)) continue
      const strategy = chooseStrategy(d, config.difficulty ?? 'standard', pool.length, opts.neighbors)
      const poolForDir = pool.filter((c) => global.some((g) => g.id === c.id))
      const tiers = strategy.tiers(target, d, { pool: poolForDir, global, rng, neighbors: opts.neighbors ?? null })
      const q = buildFromTiers(target, d, tiers, rng)
      if (q) {
        const click = q.optionIds.length === 0
        questions.push({
          ...q,
          direction: d,
          strategy: strategy.id,
          ...(click ? { acceptIds: acceptedIds(target, d, countries) } : {}),
          guesses: [],
          resolved: false,
          revealed: false,
          assisted: false,
        })
        break
      }
    }
  }
  if (!questions.length) return { ok: false, reason: 'insufficient-pool', eligible: pool.length }
  return {
    ok: true,
    session: {
      id: opts.id,
      config: { ...config, length },
      seed: opts.seed,
      catalogVersion,
      neighborPackVersion: questions.some((q) => q.strategy === 'visual-v1') ? (opts.neighbors?.version ?? null) : null,
      createdAt: opts.now.toISOString(),
      endedAt: null,
      questions,
      index: 0,
      status: 'active',
    },
  }
}

export const current = (s: Session) => s.questions[s.index]!
export const isClickQuestion = (q: Pick<SessionQuestion, 'optionIds'>) => q.optionIds.length === 0
export const isCorrectGuess = (q: Pick<SessionQuestion, 'targetId' | 'acceptIds'>, id: string) =>
  q.acceptIds ? q.acceptIds.includes(id) : id === q.targetId
/** First-answer accuracy is what counts (retries in practice never upgrade it). */
export const firstTryCorrect = (q: SessionQuestion) => q.guesses.length > 0 && isCorrectGuess(q, q.guesses[0]!)
export const misses = (s: Session) => s.questions.filter((q) => q.guesses.length > 0 && !firstTryCorrect(q)).length
export const livesLeft = (s: Session) =>
  s.config.mode === 'challenge' ? Math.max(0, CHALLENGE_LIVES - misses(s)) : null
export const isLastStep = (s: Session) => s.index >= s.questions.length - 1 || livesLeft(s) === 0

function patchCurrent(s: Session, patch: Partial<SessionQuestion>): Session {
  return { ...s, questions: s.questions.map((q, i) => (i === s.index ? { ...q, ...patch } : q)) }
}

/** Mark the current question as shown with a pre-answer location hint. Idempotent; ignored after the first guess. */
export function markAssisted(s: Session): Session {
  const q = current(s)
  return s.status !== 'active' || q.assisted || q.guesses.length ? s : patchCurrent(s, { assisted: true })
}

/**
 * Practice: a wrong guess is recorded and the learner may try again (first-answer outcome is kept).
 * Challenge and review: the first guess resolves the question.
 */
export function answer(s: Session, optionId: string): Session {
  const q = current(s)
  if (s.status !== 'active' || q.resolved || q.guesses.includes(optionId)) return s
  const click = isClickQuestion(q)
  if (!click && !q.optionIds.includes(optionId)) return s
  const guesses = [...q.guesses, optionId]
  const correct = isCorrectGuess(q, optionId)
  const singleShot = s.config.mode === 'challenge' || s.config.kind === 'review'
  const outOfTries = click ? guesses.length >= MAX_CLICK_TRIES : guesses.length >= q.optionIds.length - 1
  return patchCurrent(s, { guesses, resolved: correct || singleShot || outOfTries })
}

export function reveal(s: Session): Session {
  const q = current(s)
  return s.status !== 'active' || q.resolved ? s : patchCurrent(s, { resolved: true, revealed: true })
}

export function next(s: Session, now: Date): Session {
  if (s.status !== 'active' || !current(s).resolved) return s
  if (isLastStep(s)) return { ...s, status: 'finished', endedAt: now.toISOString() }
  return { ...s, index: s.index + 1 }
}

export interface SessionSummary {
  answered: number
  firstTryCorrect: number
  assisted: number
  accuracy: number
  missedIds: string[]
  countryIds: string[]
  durationMs: number
}
export function summarize(s: Session): SessionSummary {
  const done = s.questions.filter((q) => q.resolved)
  const first = done.filter(firstTryCorrect)
  const missed = [...new Set(done.filter((q) => !firstTryCorrect(q)).map((q) => q.targetId))]
  return {
    answered: done.length,
    firstTryCorrect: first.length,
    assisted: done.filter((q) => q.assisted).length,
    accuracy: done.length ? Math.round((first.length / done.length) * 100) : 0,
    missedIds: missed,
    countryIds: [...new Set(done.map((q) => q.targetId))],
    durationMs: (s.endedAt ? Date.parse(s.endedAt) : Date.now()) - Date.parse(s.createdAt),
  }
}
