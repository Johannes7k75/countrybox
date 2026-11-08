<script setup lang="ts">
import { project, type CatalogCountry } from '@countrybox/catalog'
import type { MapClickStyle } from '@countrybox/domain'

/**
 * Answer by clicking the map.
 *   borders    — all borders drawn; hovered/clicked country highlighted
 *   silhouette — land as one surface, no highlight; only a marker where you clicked
 * Zoom: wheel, pinch, buttons; pan: drag. A drag never counts as a click.
 * Sea clicks within a few pixels of a country count for that country (tiny states and islands stay answerable).
 * After the question resolves, borders are shown in both modes and the map zooms to the answer.
 */
const props = withDefaults(
  defineProps<{
    mode: MapClickStyle
    resolved: boolean
    /** Countries that count as correct (shown after resolving). */
    correctIds: string[]
    guesses: string[]
    /** Initial view: bounding box of these ids (e.g. the session region); empty = whole world. */
    focusIds?: string[]
  }>(),
  { focusIds: () => [] },
)
const emit = defineEmits<{ pick: [id: string] }>()
const world = useWorld()
const { t, name } = useT()
const { byId } = useCatalog()
const svgEl = ref<SVGSVGElement | null>(null)
const RATIO = 0.6 // viewBox height / width (matches the container aspect-ratio)

type Box = [number, number, number, number]
const fit = (b: [number, number, number, number], pad = 1.15): Box => {
  const w = world.value!
  let vw = Math.max((b[2] - b[0]) * pad, 60),
    vh = Math.max((b[3] - b[1]) * pad, 60 * RATIO)
  if (vh / vw > RATIO) vw = vh / RATIO
  else vh = vw * RATIO
  vw = Math.min(vw, w.w)
  vh = vw * RATIO
  const cx = (b[0] + b[2]) / 2,
    cy = (b[1] + b[3]) / 2
  return [cx - vw / 2, cy - vh / 2, vw, vh]
}
const home = computed<Box | null>(() => {
  const w = world.value
  if (!w) return null
  const boxes = props.focusIds.map((id) => w.boxes[id]).filter((b): b is [number, number, number, number] => !!b)
  if (!boxes.length) return fit([0, 0, w.w, w.h], 1)
  return fit([
    Math.min(...boxes.map((b) => b[0])),
    Math.min(...boxes.map((b) => b[1])),
    Math.max(...boxes.map((b) => b[2])),
    Math.max(...boxes.map((b) => b[3])),
  ])
})
// After answering, zoom to the correct country so the outline can be studied.
watch(
  () => props.resolved,
  (r) => {
    const b = r && world.value ? world.value.boxes[props.correctIds[0] ?? ''] : undefined
    if (b) vb.value = fit([b[0], b[1], b[2], b[3]], 4)
  },
)
const {
  vb,
  reset: resetView,
  zoomBy: zoom,
  toMap,
  handlers,
} = usePanZoom({
  svg: () => svgEl.value,
  home,
  ratio: RATIO,
  maxWidth: () => (world.value?.w ?? 1000) * 1.2,
  onTap: (e) => {
    if (!props.resolved) pick(e)
  },
})
defineExpose({ resetView })
function pick(e: PointerEvent) {
  const w = world.value,
    svg = svgEl.value,
    v = vb.value
  if (!w || !svg || !v) return
  const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-id]') as SVGElement | null
  const id = hit?.dataset.id
  const p = toMap(e.clientX, e.clientY)
  if (p) lastClick.value = p
  if (id) return emit('pick', id)
  if (!p) return
  // Sea click: snap to the smallest country whose box (+ tolerance) contains the point.
  const tol = 8 * (v[2] / svg.getBoundingClientRect().width)
  let best: { id: string; area: number } | null = null
  for (const [cid, b] of Object.entries(w.boxes)) {
    if (p[0] < b[0] - tol || p[0] > b[2] + tol || p[1] < b[1] - tol || p[1] > b[3] + tol) continue
    const area = (b[2] - b[0]) * (b[3] - b[1])
    if (!best || area < best.area) best = { id: cid, area }
  }
  if (best && best.area < 40) emit('pick', best.id) // only snap for small targets; big countries need a real hit
  else announceMiss.value++
}
const lastClick = ref<[number, number] | null>(null)
const announceMiss = ref(0)
const hovered = ref<string | null>(null)

const showBorders = computed(() => props.mode === 'borders' || props.resolved)
const lands = computed(() => {
  const w = world.value
  if (!w) return []
  const correct = new Set(props.resolved ? props.correctIds : [])
  const wrong = new Set(props.guesses.filter((g) => !props.correctIds.includes(g)))
  return Object.entries(w.paths).map(([id, d]) => {
    const cls = ['land']
    if (correct.has(id)) cls.push('ok')
    else if (wrong.has(id) && (props.mode === 'borders' || props.resolved)) cls.push('miss')
    else if (props.mode === 'borders' && !props.resolved && hovered.value === id) cls.push('hover')
    return { id, d, cls: cls.join(' ') }
  })
})
const r = computed(() => (vb.value ? vb.value[2] * 0.008 : 1))
const correctDots = computed(() => {
  if (!props.resolved || !world.value) return []
  return props.correctIds
    .map((id) => byId.value.get(id))
    .filter((c): c is CatalogCountry => !!c?.center)
    .map((c) => {
      const [x, y] = project(world.value!, c.center![0], c.center![1])
      return { id: c.id, x, y }
    })
})
const hoverName = computed(() =>
  props.mode === 'borders' && props.resolved && hovered.value
    ? byId.value.get(hovered.value)
      ? name(byId.value.get(hovered.value)!)
      : ''
    : '',
)
</script>

<template>
  <div class="clickmap" :class="[`is-${mode}`, { 'is-resolved': resolved }]">
    <svg
      v-if="world && vb"
      ref="svgEl"
      class="worldmap"
      :class="{ silhouette: !showBorders }"
      :viewBox="vb.map((x) => x.toFixed(2)).join(' ')"
      preserveAspectRatio="xMidYMid meet"
      role="application"
      :aria-label="t('map.clickLabel')"
      v-on="handlers"
      @pointerleave="hovered = null"
    >
      <rect class="sea" x="-2000" y="-2000" width="5000" height="5000" />
      <g class="lands">
        <path v-for="l in lands" :key="l.id" :d="l.d" :class="l.cls" :data-id="l.id" @pointerenter="hovered = l.id" />
      </g>
      <circle v-for="dt in correctDots" :key="dt.id" class="dot ok" :cx="dt.x" :cy="dt.y" :r="r" />
      <!-- Without borders the marker is the only feedback; with borders the highlighted country is. -->
      <g
        v-if="lastClick && mode === 'silhouette' && !resolved"
        class="click-mark"
        :transform="`translate(${lastClick[0]} ${lastClick[1]})`"
      >
        <circle :r="r * 1.6" />
        <path :d="`M${-r} ${-r}L${r} ${r}M${r} ${-r}L${-r} ${r}`" />
      </g>
    </svg>
    <div v-else class="worldmap map-loading" />
    <ZoomTools @in="zoom(1 / 1.5)" @out="zoom(1.5)" @reset="resetView" />
    <span v-if="hoverName" class="clickmap-name">{{ hoverName }}</span>
    <span class="sr-only" aria-live="polite">{{ announceMiss ? t('map.clickedSea') : '' }}</span>
  </div>
</template>
