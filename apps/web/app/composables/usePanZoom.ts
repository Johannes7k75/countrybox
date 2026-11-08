import type { Box } from '~/utils/mapView'

/**
 * Zoom & pan for an SVG map by manipulating its viewBox.
 * Wheel zooms around the cursor, two-finger pinch zooms, drag pans; a press that does not move is a tap (onTap).
 * `ratio` keeps the viewBox aspect (height/width) constant; `maxWidth` limits zooming out.
 */
export function usePanZoom(opts: {
  svg: () => SVGSVGElement | null | undefined
  home: Ref<Box | null>
  ratio: number
  maxWidth: () => number
  minWidth?: number
  onTap?: (e: PointerEvent, point: [number, number] | null) => void
}) {
  const vb = ref<Box | null>(null)
  watch(
    opts.home,
    (h) => {
      if (h) vb.value = [...h] as Box
    },
    { immediate: true },
  )
  const reset = () => {
    if (opts.home.value) vb.value = [...opts.home.value] as Box
  }
  const zoomed = computed(() => !!vb.value && !!opts.home.value && Math.abs(vb.value[2] - opts.home.value[2]) > 0.5)

  function toMap(clientX: number, clientY: number): [number, number] | null {
    const ctm = opts.svg()?.getScreenCTM()
    if (!ctm) return null
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
    return [p.x, p.y]
  }
  function zoomBy(factor: number, cx?: number, cy?: number) {
    const v = vb.value
    if (!v) return
    const nw = Math.min(opts.maxWidth(), Math.max(opts.minWidth ?? 12, v[2] * factor)),
      nh = nw * opts.ratio
    const px = cx ?? v[0] + v[2] / 2,
      py = cy ?? v[1] + v[3] / 2
    vb.value = [px - (px - v[0]) * (nw / v[2]), py - (py - v[1]) * (nh / v[3]), nw, nh]
  }
  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const p = toMap(e.clientX, e.clientY)
    zoomBy(e.deltaY > 0 ? 1.2 : 1 / 1.2, p?.[0], p?.[1])
  }

  const pointers = new Map<number, { x: number; y: number }>()
  let start: { x: number; y: number; vb: Box } | null = null
  let moved = false,
    pinchDist = 0
  function onPointerdown(e: PointerEvent) {
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.size === 1 && vb.value) {
      start = { x: e.clientX, y: e.clientY, vb: [...vb.value] as Box }
      moved = false
    }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      pinchDist = Math.hypot(a!.x - b!.x, a!.y - b!.y)
      moved = true
    }
  }
  function onPointermove(e: PointerEvent) {
    if (!pointers.has(e.pointerId)) return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y)
      if (pinchDist) {
        const m = toMap((a!.x + b!.x) / 2, (a!.y + b!.y) / 2)
        zoomBy(pinchDist / d, m?.[0], m?.[1])
      }
      pinchDist = d
      return
    }
    const svg = opts.svg()
    if (!start || !svg) return
    const dx = e.clientX - start.x,
      dy = e.clientY - start.y
    if (Math.hypot(dx, dy) > 5) moved = true
    if (!moved) return
    const scale = start.vb[2] / svg.getBoundingClientRect().width
    vb.value = [start.vb[0] - dx * scale, start.vb[1] - dy * scale, start.vb[2], start.vb[3]]
  }
  function onPointerup(e: PointerEvent) {
    pointers.delete(e.pointerId)
    if (pointers.size) return
    const wasDrag = moved
    start = null
    pinchDist = 0
    if (!wasDrag) opts.onTap?.(e, toMap(e.clientX, e.clientY))
  }
  const handlers = {
    wheel: onWheel,
    pointerdown: onPointerdown,
    pointermove: onPointermove,
    pointerup: onPointerup,
    pointercancel: onPointerup,
  }
  return { vb, reset, zoomBy, zoomed, toMap, handlers }
}
