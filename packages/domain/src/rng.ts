/** Deterministic PRNG (mulberry32). Sessions store their seed so a run can be reproduced. */
export type Rng = () => number
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const randomSeed = () => Math.floor(Math.random() * 2 ** 31)
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const r = items.slice()
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[r[i], r[j]] = [r[j]!, r[i]!]
  }
  return r
}
