<script setup lang="ts">
import type { CatalogCountry } from '@countrybox/catalog'
import type { MapPromptStyle } from '@countrybox/domain'

import { FOCUS_RATIO, initialView } from '~/utils/mapView'
/**
 * Map as the question:
 *   outline-capital — country outlined + capital dot
 *   outline         — country outlined only
 *   capital         — no borders at all, only the capital dot (fixed zoom, so country size is no hint)
 * Zoomable (wheel / pinch / drag / buttons) unless `zoomable` is false (e.g. setup thumbnails).
 */
const props = withDefaults(defineProps<{ country: CatalogCountry; mapStyle: MapPromptStyle; zoomable?: boolean }>(), {
  zoomable: true,
})
const { t } = useT()
const world = useWorld()
const mapRef = ref<{ $el?: Element } | null>(null)
const style = computed<MapPromptStyle>(() =>
  props.mapStyle === 'capital' && !props.country.capitalPos ? 'outline' : props.mapStyle,
)
const home = computed(() =>
  world.value
    ? initialView(
        world.value,
        style.value === 'capital' ? { focusPoint: props.country.capitalPos } : { focus: props.country.id },
      ).vb
    : null,
)
const pz = usePanZoom({
  svg: () => mapRef.value?.$el as SVGSVGElement | undefined,
  home,
  ratio: FOCUS_RATIO,
  maxWidth: () => (world.value?.w ?? 1000) * 1.2,
})
const handlers = computed(() => (props.zoomable ? pz.handlers : {}))
</script>
<template>
  <div class="map-prompt" :class="[`is-${style}`, { 'is-zoomable': zoomable }]">
    <WorldMap
      v-if="style === 'capital'"
      ref="mapRef"
      silhouette
      :focus-point="country.capitalPos"
      :points="[country.capitalPos!]"
      :view-box="zoomable ? pz.vb.value : null"
      :label="t('map.promptCapitalLabel')"
      v-on="handlers"
    />
    <WorldMap
      v-else
      ref="mapRef"
      :focus="country.id"
      :highlight="country.id"
      :points="style === 'outline-capital' && country.capitalPos ? [country.capitalPos] : []"
      :view-box="zoomable ? pz.vb.value : null"
      :label="t('map.promptOutlineLabel')"
      v-on="handlers"
    />
    <ZoomTools v-if="zoomable" @in="pz.zoomBy(1 / 1.5)" @out="pz.zoomBy(1.5)" @reset="pz.reset()" />
  </div>
</template>
