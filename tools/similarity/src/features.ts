/**
 * lab-grid-v1 — a transparent colour/layout baseline (no ML).
 * Each flag is rasterised to 64×48 on white, converted to CIELAB, and averaged over 4×3, 8×6 and 16×12 grids.
 * Distance = Euclidean over the concatenated grids (each scale normalised so it contributes equally), minimised over
 * the original, horizontally and vertically mirrored renderings (mirrors carry a small penalty), because mirrored
 * tricolours (Ireland/Côte d'Ivoire, Guinea/Mali, Poland/Indonesia) are classic confusions.
 */
import { Resvg } from '@resvg/resvg-js'

export const METHOD = 'lab-grid-v1'
export const W = 64,
  H = 48
export const GRIDS: [number, number, number][] = [
  [4, 3, 1],
  [8, 6, 1],
  [16, 12, 0.5],
] // cols, rows, weight
export const MIRROR_PENALTY = 1.08

export type Pixels = Float32Array // Lab triples, row-major, W*H*3

export function rasterize(svg: string): Uint8Array {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: W }, background: 'white' })
  const img = r.render()
  if (img.width !== W || img.height !== H) throw new Error(`unexpected raster size ${img.width}x${img.height}`)
  return img.pixels // RGBA
}

const srgbToLinear = (c: number) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116)
export function toLab(rgba: Uint8Array): Pixels {
  const out = new Float32Array(W * H * 3)
  for (let i = 0; i < W * H; i++) {
    const r = srgbToLinear(rgba[i * 4]!),
      g = srgbToLinear(rgba[i * 4 + 1]!),
      b = srgbToLinear(rgba[i * 4 + 2]!)
    const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047,
      y = 0.2126 * r + 0.7152 * g + 0.0722 * b,
      z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    const fx = f(x),
      fy = f(y),
      fz = f(z)
    out[i * 3] = 116 * fy - 16
    out[i * 3 + 1] = 500 * (fx - fy)
    out[i * 3 + 2] = 200 * (fy - fz)
  }
  return out
}

export function mirror(p: Pixels, axis: 'h' | 'v'): Pixels {
  const out = new Float32Array(p.length)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const sx = axis === 'h' ? W - 1 - x : x,
        sy = axis === 'v' ? H - 1 - y : y
      for (let k = 0; k < 3; k++) out[(y * W + x) * 3 + k] = p[(sy * W + sx) * 3 + k]!
    }
  return out
}

export function featureVector(p: Pixels): Float32Array {
  const parts: number[] = []
  for (const [cols, rows, weight] of GRIDS) {
    const cw = W / cols,
      ch = H / rows,
      norm = weight / Math.sqrt(cols * rows)
    for (let gy = 0; gy < rows; gy++)
      for (let gx = 0; gx < cols; gx++) {
        let L = 0,
          A = 0,
          B = 0,
          n = 0
        for (let y = gy * ch; y < (gy + 1) * ch; y++)
          for (let x = gx * cw; x < (gx + 1) * cw; x++) {
            const i = (y * W + x) * 3
            L += p[i]!
            A += p[i + 1]!
            B += p[i + 2]!
            n++
          }
        parts.push((L / n) * norm, (A / n) * norm, (B / n) * norm)
      }
  }
  return Float32Array.from(parts)
}

export interface FlagFeatures {
  id: string
  base: Float32Array
  h: Float32Array
  v: Float32Array
}
export function flagFeatures(id: string, svg: string): FlagFeatures {
  const lab = toLab(rasterize(svg))
  return { id, base: featureVector(lab), h: featureVector(mirror(lab, 'h')), v: featureVector(mirror(lab, 'v')) }
}

const euclid = (a: Float32Array, b: Float32Array) => {
  let s = 0
  for (let i = 0; i < a.length; i++) {
    const d = a[i]! - b[i]!
    s += d * d
  }
  return Math.sqrt(s)
}
export function distance(a: FlagFeatures, b: FlagFeatures): number {
  return Math.min(euclid(a.base, b.base), euclid(a.base, b.h) * MIRROR_PENALTY, euclid(a.base, b.v) * MIRROR_PENALTY)
}

/** Same-orientation distance only (no mirroring) — used to decide visual IDENTITY, where mirrored flags must stay distinct. */
export const plainDistance = (a: FlagFeatures, b: FlagFeatures) => euclid(a.base, b.base)
/**
 * Below this plain distance two renderings are treated as the same flag (e.g. France and its overseas
 * territories: 1.37; Netherlands/Bonaire: 0). Mirrored pairs such as Guinea/Mali are far above it.
 */
export const IDENTICAL_THRESHOLD = 2.5
