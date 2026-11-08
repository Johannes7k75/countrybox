<script setup lang="ts">
import { project, type CatalogCountry } from '@countrybox/catalog'

import { initialView, type Box } from '~/utils/mapView'

/**
 * Inline world map (equirectangular, generated catalog geometry).
 * tint: id → ramp step 0–5 or 'x' · marks: id → 'ok' | 'miss' · highlight: ochre focus
 * focus: zooms to the country's largest landmass · pins: centre markers · interactive: listed ids become buttons
 */
const props = withDefaults(
  defineProps<{
    tint?: Record<string, number | string>
    marks?: Record<string, 'ok' | 'miss'>
    highlight?: string | null
    focus?: string | null
    pins?: CatalogCountry[]
    interactive?: string[]
    /** Small markers at country centres (keeps tiny states visible): id → 'ok' | 'miss' */
    dots?: Record<string, 'ok' | 'miss'>
    /** Pins at explicit positions [lat, lon] (e.g. capitals), drawn like `pins`. */
    points?: [number, number][]
    /** Zoom to a fixed window around a point instead of a country (used by "capital only" prompts, so size is not a hint). */
    focusPoint?: [number, number] | null
    /** Hide internal borders: land is drawn as one surface. */
    silhouette?: boolean
    /** Explicit viewBox (zoom/pan controlled by the parent); overrides focus/focusPoint framing. */
    viewBox?: Box | null
    label?: string
  }>(),
  {
    viewBox: null,
    tint: () => ({}),
    marks: () => ({}),
    highlight: null,
    focus: null,
    pins: () => [],
    interactive: () => [],
    dots: () => ({}),
    points: () => [],
    focusPoint: null,
    silhouette: false,
    label: '',
  },
)
const emit = defineEmits<{ select: [id: string] }>()
const world = useWorld()
const { t, name } = useT()
const { byId } = useCatalog()

const view = computed(() => {
  const w = world.value
  if (!w) return null
  const init = initialView(w, { focus: props.focus, focusPoint: props.focusPoint })
  const vb: Box = props.viewBox ?? init.vb
  const aspect = props.viewBox ? 'xMidYMid meet' : init.focused ? 'xMidYMid slice' : 'xMidYMid meet'
  const grat: string[] = []
  for (let lon = -150; lon <= 150; lon += 30) grat.push(`M${project(w, 0, lon)[0].toFixed(1)},0V${w.h}`)
  for (const lat of [-30, 30, 60]) grat.push(`M0,${project(w, lat, 0)[1].toFixed(1)}H${w.w}`)
  const interactive = new Set(props.interactive)
  const lands = Object.entries(w.paths).map(([id, d]) => {
    const cls = ['land']
    const tv = props.tint[id]
    if (tv !== undefined && tv !== null) cls.push('s' + tv)
    const m = props.marks[id]
    if (m) cls.push(m)
    if (props.highlight === id) cls.push('hl')
    const hit = interactive.has(id)
    if (hit) cls.push('hit')
    return { id, d, cls: cls.join(' '), hit }
  })
  const r = vb[2] * 0.011
  const pins = [
    ...props.pins
      .filter((c) => c.center)
      .map((c) => {
        const [x, y] = project(w, c.center![0], c.center![1])
        return { id: c.id, x, y }
      }),
    ...props.points.map(([lat, lon], i) => {
      const [x, y] = project(w, lat, lon)
      return { id: `pt${i}`, x, y }
    }),
  ]
  const dots = Object.entries(props.dots)
    .map(([id, kind]) => {
      const c = byId.value.get(id)
      if (!c?.center) return null
      const [x, y] = project(w, c.center[0], c.center[1])
      return { id, x, y, kind }
    })
    .filter((d) => d !== null)
  return {
    dots,
    vb: vb.map((v) => v.toFixed(1)).join(' '),
    aspect,
    grat: grat.join(''),
    eq: project(w, 0, 0)[1].toFixed(1),
    w: w.w,
    lands,
    pins,
    r,
  }
})
const countryLabel = (id: string) => {
  const c = byId.value.get(id)
  return c ? name(c) : id
}
function onKey(e: KeyboardEvent, id: string) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    emit('select', id)
  }
}
</script>

<template>
  <svg
    v-if="view"
    class="worldmap"
    :class="{ silhouette }"
    :viewBox="view.vb"
    :preserveAspectRatio="view.aspect"
    v-bind="
      label
        ? { role: 'img', 'aria-label': label }
        : interactive.length
          ? { role: 'group', 'aria-label': t('common.worldMap') }
          : { 'aria-hidden': 'true' }
    "
  >
    <rect class="sea" x="-500" y="-500" width="2000" height="1400" />
    <path class="grat" :d="view.grat" />
    <path class="equator" :d="`M0,${view.eq}H${view.w}`" />
    <g class="lands">
      <template v-for="l in view.lands" :key="l.id">
        <path
          v-if="l.hit"
          :d="l.d"
          :class="l.cls"
          tabindex="0"
          role="button"
          :aria-label="countryLabel(l.id)"
          @click="emit('select', l.id)"
          @keydown="onKey($event, l.id)"
        />
        <path v-else :d="l.d" :class="l.cls" />
      </template>
    </g>
    <circle
      v-for="d in view.dots"
      :key="'d' + d.id"
      class="dot"
      :class="d.kind"
      :cx="d.x"
      :cy="d.y"
      :r="view.r * 0.75"
    />
    <g v-for="p in view.pins" :key="p.id" class="pin">
      <circle class="pin-pulse" :cx="p.x" :cy="p.y" :r="view.r * 2.6" />
      <circle class="pin-dot" :cx="p.x" :cy="p.y" :r="view.r" />
    </g>
  </svg>
  <div v-else class="worldmap map-loading" aria-hidden="true" />
</template>
