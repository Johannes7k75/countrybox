import { project, type WorldMap } from '@countrybox/catalog'

export type Box = [number, number, number, number]
/** Height/width of focused map views (matches the 3:2 containers). */
export const FOCUS_RATIO = 0.66

/** Initial framing used by WorldMap: a country's largest landmass, a fixed window around a point, or the whole world. */
export function initialView(
  w: WorldMap,
  opts: { focus?: string | null; focusPoint?: [number, number] | null },
): { vb: Box; focused: boolean } {
  if (opts.focusPoint) {
    const [px, py] = project(w, opts.focusPoint[0], opts.focusPoint[1])
    const vw = 150,
      vh = vw * FOCUS_RATIO
    return { vb: [px - vw / 2, py - vh / 2, vw, vh], focused: true }
  }
  const box = opts.focus ? w.boxes[opts.focus] : undefined
  if (box) {
    const [x0, y0, x1, y1] = box
    const cx = (x0 + x1) / 2,
      cy = (y0 + y1) / 2
    let vw = Math.max((x1 - x0) * 2.6, 140),
      vh = vw * FOCUS_RATIO
    if ((y1 - y0) * 2.6 > vh) {
      vh = (y1 - y0) * 2.6
      vw = vh / FOCUS_RATIO
    }
    return { vb: [cx - vw / 2, cy - vh / 2, vw, vh], focused: true }
  }
  return { vb: [0, 0, w.w, w.h], focused: false }
}
