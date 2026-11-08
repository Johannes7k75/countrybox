import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import type { Catalog, CatalogCountry, NeighborPack } from '@countrybox/catalog'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  DIRECTIONS,
  REVIEW_DIRECTIONS,
  MAX_CLICK_TRIES,
  acceptedIds,
  firstTryCorrect,
  DRILL_DIRECTIONS,
  VISUAL_NEAR_BAND,
  VISUAL_MID_BAND,
  answer,
  chooseStrategy,
  buildQuestion,
  createRng,
  createSession,
  eligible,
  fieldValues,
  isUnambiguous,
  livesLeft,
  markAssisted,
  next,
  normalize,
  outcomeOf,
  reveal,
  schedule,
  summarize,
  type Direction,
  type SessionConfig,
} from '../src'

const catalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../catalog/generated/countries.json', import.meta.url)), 'utf8'),
) as Catalog
const countries = catalog.countries
const pack = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../catalog/generated/flag-neighbors.json', import.meta.url)), 'utf8'),
) as NeighborPack
const byId = new Map(countries.map((c) => [c.id, c]))
const now = new Date('2026-11-07T12:00:00Z')
const cfg = (over: Partial<SessionConfig> = {}): SessionConfig => ({
  direction: 'flag-name',
  scope: 'un',
  region: 'world',
  length: 10,
  mode: 'practice',
  kind: 'practice',
  ...over,
})
const mk = (over: Partial<SessionConfig> = {}, seed = 1) => {
  const r = createSession(countries, catalog.version, cfg(over), { id: 's', seed, now })
  if (!r.ok) throw new Error('pool')
  return r.session
}

describe('directions', () => {
  it('has 30 distinct ordered pairs (20 classic + 10 with the map)', () => {
    expect(DIRECTIONS).toHaveLength(30)
    expect(new Set(DIRECTIONS).size).toBe(30)
    expect(REVIEW_DIRECTIONS).toHaveLength(20)
    expect(REVIEW_DIRECTIONS.some((d) => d.includes('location'))).toBe(false)
  })
  it.each(DIRECTIONS)('%s: every eligible UN country yields an unambiguous 4-option question', (d: Direction) => {
    const pool = eligible(countries, d).filter((c) => c.un)
    const rng = createRng(42)
    for (const t of pool) {
      const q = buildQuestion(t, d, pool, eligible(countries, d), rng)
      expect(q, `${d} ${t.id}`).not.toBeNull()
      expect(isUnambiguous(q!, d, byId), `${d} ${t.id} ${q!.optionIds.join(',')}`).toBe(true)
    }
  })
  it('shared calling codes never appear twice among options (+1, +7)', () => {
    const us = byId.get('us')!,
      ca = byId.get('ca')!
    const pool = eligible(countries, 'name-callingCode')
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const q = buildQuestion(us, 'name-callingCode', pool, pool, createRng(seed))!
        expect(q.optionIds).not.toContain(ca.id)
      }),
      { numRuns: 200 },
    )
  })
  it('identical flags are never both offered', () => {
    const fr = byId.get('fr')!
    const pool = eligible(countries, 'name-flag')
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const q = buildQuestion(fr, 'name-flag', pool, pool, createRng(seed))!
        const keys = q.optionIds.map((id) => byId.get(id)!.flagKey)
        expect(new Set(keys).size).toBe(4)
      }),
      { numRuns: 200 },
    )
  })
  it('accepts any capital of a multi-capital country as its value', () => {
    expect(fieldValues(byId.get('za')!, 'capital', 'de')).toContain('Kapstadt')
  })
})

describe('sessions', () => {
  it('honours length, starts at 1 and is deterministic per seed', () => {
    const a = mk({ length: 20 }, 7),
      b = mk({ length: 20 }, 7)
    expect(a.questions).toHaveLength(20)
    expect(a.index).toBe(0)
    expect(a.questions.map((q) => q.optionIds)).toEqual(b.questions.map((q) => q.optionIds))
  })
  it('tiny pools terminate and repeat targets', () => {
    const s = mk({ targetIds: ['pt'], length: 5 })
    expect(s.questions.every((q) => q.targetId === 'pt')).toBe(true)
  })
  it('a country drill varies the direction per question and uses neighbouring distractors', () => {
    const s = mk({ targetIds: ['tr'], directions: DRILL_DIRECTIONS, length: DRILL_DIRECTIONS.length, scope: 'all' })
    const dirs = s.questions.map((q) => q.direction)
    expect(new Set(dirs).size).toBe(dirs.length)
    expect(s.questions.every((q) => q.targetId === 'tr' && isUnambiguous(q, q.direction!, byId))).toBe(true)
    const tr = byId.get('tr')!
    const sameRegion = s.questions
      .flatMap((q) => q.optionIds)
      .filter((id) => id !== 'tr')
      .every((id) => byId.get(id)!.region === tr.region)
    expect(sameRegion).toBe(true)
  })
  it('reports an insufficient pool', () => {
    const r = createSession(countries, catalog.version, cfg({ targetIds: ['um'], direction: 'capital-name' }), {
      id: 'x',
      seed: 1,
      now,
    })
    expect(r.ok).toBe(false)
  })
  it('records all answers of a 20 question game, including the final one', () => {
    let s = mk({ length: 20 })
    while (s.status === 'active') {
      s = answer(s, s.questions[s.index]!.targetId)
      s = next(s, now)
    }
    const sum = summarize(s)
    expect(sum.answered).toBe(20)
    expect(sum.firstTryCorrect).toBe(20)
  })
  it('practice retry keeps the first-answer failure; double activation counts once', () => {
    let s = mk()
    const q = s.questions[0]!
    const wrong = q.optionIds.find((id) => id !== q.targetId)!
    s = answer(s, wrong)
    s = answer(s, wrong)
    expect(s.questions[0]!.guesses).toEqual([wrong])
    expect(s.questions[0]!.resolved).toBe(false)
    s = answer(s, q.targetId)
    expect(s.questions[0]!.resolved).toBe(true)
    s = next(s, now)
    expect(summarize(s).missedIds).toEqual([q.targetId])
  })
  it('next() before resolving does nothing; reveal resolves', () => {
    let s = mk()
    expect(next(s, now).index).toBe(0)
    s = reveal(s)
    expect(next(s, now).index).toBe(1)
  })
  it('challenge ends after three misses', () => {
    let s = mk({ mode: 'challenge', length: 20 })
    while (s.status === 'active') {
      const q = s.questions[s.index]!
      s = answer(
        s,
        q.optionIds.find((id) => id !== q.targetId)!,
      )
      s = next(s, now)
    }
    expect(livesLeft(s)).toBe(0)
    expect(summarize(s).answered).toBe(3)
  })
  it('a pre-answer hint marks the question assisted; after answering it does not', () => {
    let s = markAssisted(mk())
    expect(s.questions[0]!.assisted).toBe(true)
    let t = mk()
    t = answer(t, t.questions[0]!.targetId)
    t = markAssisted(t)
    expect(t.questions[0]!.assisted).toBe(false)
  })
})

describe('map questions', () => {
  it('click questions have no options and accept every country matching the prompt', () => {
    const us = byId.get('us')!,
      fr = byId.get('fr')!
    const plusOne = acceptedIds(us, 'callingCode-location', countries)
    expect(plusOne).toEqual(expect.arrayContaining(['us', 'ca', 'jm']))
    // territories sharing France's flag have no map outline, so only France itself is clickable
    expect(acceptedIds(fr, 'flag-location', countries)).toEqual(['fr'])
    expect(acceptedIds(byId.get('ru')!, 'callingCode-location', countries).sort()).toEqual(['kz', 'ru'])
    expect(acceptedIds(byId.get('jp')!, 'name-location', countries)).toEqual(['jp'])
    const s = mk({ direction: 'name-location' })
    expect(s.questions.every((q) => q.optionIds.length === 0 && q.acceptIds?.includes(q.targetId))).toBe(true)
  })
  it('only mapped countries are asked for clicks', () => {
    const s = mk({ direction: 'capital-location', scope: 'all', length: 100 })
    expect(s.questions.every((q) => byId.get(q.targetId)!.map)).toBe(true)
  })
  it('a click on a country with the same calling code counts as correct', () => {
    let s = mk({ direction: 'callingCode-location', targetIds: ['us'], scope: 'all', length: 1 })
    s = answer(s, 'ca')
    expect(s.questions[0]!.resolved).toBe(true)
    expect(firstTryCorrect(s.questions[0]!)).toBe(true)
  })
  it(`practice click questions allow ${MAX_CLICK_TRIES} tries; the first decides accuracy`, () => {
    let s = mk({ direction: 'name-location', targetIds: ['jp'], scope: 'all', length: 1 })
    s = answer(s, 'cn')
    s = answer(s, 'cn')
    s = answer(s, 'kr')
    expect(s.questions[0]!.resolved).toBe(false)
    s = answer(s, 'kp')
    expect(s.questions[0]!.resolved).toBe(true)
    expect(firstTryCorrect(s.questions[0]!)).toBe(false)
    expect(s.questions[0]!.guesses).toEqual(['cn', 'kr', 'kp'])
  })
  it('map prompts (location → name) get four unambiguous options from the same region', () => {
    const s = mk({ direction: 'location-name', length: 30 })
    expect(
      s.questions.every(
        (q) => q.optionIds.length === 4 && isUnambiguous(q, 'location-name', byId) && q.strategy === 'region-v1',
      ),
    ).toBe(true)
    const sameRegion = s.questions.flatMap((q) =>
      q.optionIds.map((id) => byId.get(id)!.region === byId.get(q.targetId)!.region),
    )
    expect(sameRegion.filter(Boolean).length / sameRegion.length).toBeGreaterThan(0.9)
  })
  it('country drills now include the map both ways', () => {
    const s = mk({ targetIds: ['tr'], directions: DRILL_DIRECTIONS, length: DRILL_DIRECTIONS.length, scope: 'all' })
    const dirs = s.questions.map((q) => q.direction)
    expect(dirs).toContain('location-name')
    expect(dirs).toContain('name-location')
  })
})

describe('distractor strategies', () => {
  it('policy: hard flag questions use visual-v1, hard text questions region-v1, standard tiny pools region-v1', () => {
    expect(chooseStrategy('flag-name', 'hard', 100, pack).id).toBe('visual-v1')
    expect(chooseStrategy('flag-name', 'hard', 100, null).id).toBe('region-v1')
    expect(chooseStrategy('name-capital', 'hard', 100, pack).id).toBe('region-v1')
    expect(chooseStrategy('flag-name', 'standard', 3, pack).id).toBe('region-v1')
    expect(chooseStrategy('flag-name', 'standard', 100, pack).id).toBe('random-v1')
  })
  it('hard mode draws flag distractors from visual neighbours and stays unambiguous', () => {
    for (const direction of ['flag-name', 'name-flag'] as const) {
      const r = createSession(countries, catalog.version, cfg({ direction, difficulty: 'hard', length: 40 }), {
        id: 'h',
        seed: 3,
        now,
        neighbors: pack,
      })
      if (!r.ok) throw new Error('pool')
      expect(r.session.neighborPackVersion).toBe(pack.version)
      let near = 0,
        total = 0
      for (const q of r.session.questions) {
        expect(q.strategy).toBe('visual-v1')
        expect(isUnambiguous(q, direction, byId)).toBe(true)
        const band = new Set(pack.neighbors[q.targetId]!.slice(0, VISUAL_MID_BAND))
        for (const id of q.optionIds)
          if (id !== q.targetId) {
            total++
            if (band.has(id)) near++
          }
      }
      expect(near / total).toBeGreaterThan(0.75)
      // UN-scope session: look-alikes stay inside the scope
      const outsideUn = r.session.questions.flatMap((q) => q.optionIds).filter((id) => !byId.get(id)!.un).length
      expect(outsideUn / total).toBeLessThan(0.05)
    }
  })
  it('never offers two visually identical flags (France and its territories)', () => {
    const fr = byId.get('fr')!
    for (const id of ['bl', 're', 'yt']) expect(byId.get(id)!.flagKey).toBe(fr.flagKey)
    const r = createSession(
      countries,
      catalog.version,
      cfg({ direction: 'flag-name', difficulty: 'hard', targetIds: ['fr'], length: 20, scope: 'all' }),
      { id: 'f', seed: 9, now, neighbors: pack },
    )
    if (!r.ok) throw new Error('pool')
    for (const q of r.session.questions) expect(new Set(q.optionIds.map((id) => byId.get(id)!.flagKey)).size).toBe(4)
  })
  it('falls back without a pack', () => {
    const r = createSession(countries, catalog.version, cfg({ difficulty: 'hard' }), {
      id: 'n',
      seed: 1,
      now,
      neighbors: null,
    })
    expect(r.ok && r.session.questions.every((q) => q.strategy === 'region-v1')).toBe(true)
  })
})

describe('scheduler (Leitner v1)', () => {
  const H = 3600_000,
    D = 24 * H
  it.each([
    [0, 1],
    [1, 3],
    [2, 7],
    [3, 14],
    [4, 30],
    [5, 30],
  ])('stage %i correct → +%i days', (stage, days) => {
    const r = schedule(stage, 'correct', now)
    expect(r.stage).toBe(Math.min(5, stage + 1))
    expect(r.dueAt.getTime() - now.getTime()).toBe(days * D)
  })
  it('wrong → stage 0, 10 minutes, lapse', () => {
    expect(schedule(4, 'wrong', now)).toMatchObject({
      stage: 0,
      lapse: true,
      dueAt: new Date(now.getTime() + 10 * 60_000),
    })
  })
  it('assisted success keeps the stage and schedules 10 minutes', () => {
    expect(schedule(2, 'assisted', now)).toMatchObject({ stage: 2, lapse: false })
  })
  it('stage-2 unhinted correct becomes stage 3 due exactly 7 days later', () => {
    expect(schedule(2, outcomeOf(true, false), now)).toEqual({
      stage: 3,
      dueAt: new Date(now.getTime() + 7 * D),
      lapse: false,
    })
  })
})

describe('normalize', () => {
  it('is accent and case insensitive', () => {
    expect(normalize('Reykjavík')).toBe(normalize('reykjavik'))
    expect(normalize('Côte d’Ivoire')).toBe("cote d'ivoire")
  })
})

// keep type import used
export type _C = CatalogCountry | Direction
void VISUAL_NEAR_BAND
