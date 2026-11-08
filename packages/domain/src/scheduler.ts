/**
 * Leitner v1 — explicit product policy from the blueprint (not an optimized recall model).
 *   correct, unassisted : stage+1 (max 5), due after INTERVAL_DAYS[stageBefore]
 *   wrong first answer  : stage 0, due in 10 minutes (a lapse)
 *   correct after hint  : keep stage, due in 10 minutes
 * A v1 day is exactly 24h. Only eligible due reviews may call this; practice never does.
 */
export const SCHEDULER_VERSION = 'leitner-v1'
export const MAX_STAGE = 5
export const INTERVAL_DAYS = [1, 3, 7, 14, 30, 30] as const
export const RELEARN_MINUTES = 10
const DAY = 24 * 60 * 60 * 1000
const MIN = 60 * 1000

export type ReviewOutcome = 'correct' | 'wrong' | 'assisted'

export interface ScheduleResult {
  stage: number
  dueAt: Date
  lapse: boolean
}

export function schedule(stageBefore: number, outcome: ReviewOutcome, now: Date): ScheduleResult {
  const stage = Math.max(0, Math.min(MAX_STAGE, Math.trunc(stageBefore)))
  if (outcome === 'wrong') return { stage: 0, dueAt: new Date(now.getTime() + RELEARN_MINUTES * MIN), lapse: true }
  if (outcome === 'assisted') return { stage, dueAt: new Date(now.getTime() + RELEARN_MINUTES * MIN), lapse: false }
  return {
    stage: Math.min(MAX_STAGE, stage + 1),
    dueAt: new Date(now.getTime() + INTERVAL_DAYS[stage]! * DAY),
    lapse: false,
  }
}

/** Human interval label for stage compartments: how long a card waits after being promoted INTO this stage. */
export function stageIntervalDays(stage: number): number | null {
  return stage <= 0 ? null : INTERVAL_DAYS[stage - 1]!
}

export function outcomeOf(firstGuessCorrect: boolean, assisted: boolean): ReviewOutcome {
  if (!firstGuessCorrect) return 'wrong'
  return assisted ? 'assisted' : 'correct'
}
