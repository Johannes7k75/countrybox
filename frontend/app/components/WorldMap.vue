<script setup lang="ts">
import L from "leaflet"
import { cn } from "~~/lib/utils";

interface WorldMapProps {
  hide?: boolean,
  cca3?: string
}

const props = defineProps<WorldMapProps>();

const tileMapUrl = "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
const zoom = ref(6);
const center = ref<[number, number]>([47.21322, -1.559482])

const isReady = ref(false)

const map = ref<{leafletObject: L.Map & {tap?: {enable:()=>void,disable:()=>void}},root: HTMLElement}|null>(null)
const geojson = ref<GeoJSON.GeoJSON | undefined>(undefined)

const geostyler = (feature: any) => ({
  opacity: feature.properties.code / 100_000
})

async function setGeoJson(json?: GeoJSON.GeoJSON) {
  console.log("Set geoJson", map.value)

  if (map.value) {
    nextTick(() => {
      if (json ?? geojson.value) {
        console.log(map.value!.leafletObject.fitBounds(L.geoJSON(json ?? geojson.value).getBounds()))
      }
    });
  }
}

async function updateGeoJson(ccn3: string) {
  console.log("Update GeoJson")
  enableInteraction()
  const response = await $fetch(`/api/geojson/${ccn3}`);
  geojson.value = response;
  // console.log(geojson.value.type)

  setGeoJson()
}

function onMapReady() {
  isReady.value = true
  console.log("Map ready")
}

onMounted(async () => {
  console.log("CCA3", props.cca3)
  if (props.cca3) await updateGeoJson(props.cca3)
})

function enableInteraction() {
  if (!map.value?.leafletObject) return
  map.value.leafletObject.dragging.enable();
  map.value.leafletObject.touchZoom.enable();
  map.value.leafletObject.doubleClickZoom.enable();
  map.value.leafletObject.scrollWheelZoom.enable();
  map.value.leafletObject.boxZoom.enable();
  map.value.leafletObject.keyboard.enable();
  if (map.value.leafletObject.tap) map.value.leafletObject.tap.enable();
  map.value.root.style.cursor = 'grab';
}

function disableInteraction() {
  if (!map.value?.leafletObject) return
  map.value.leafletObject.dragging.disable();
  map.value.leafletObject.touchZoom.disable();
  map.value.leafletObject.doubleClickZoom.disable();
  map.value.leafletObject.scrollWheelZoom.disable();
  map.value.leafletObject.boxZoom.disable();
  map.value.leafletObject.keyboard.disable();
  if (map.value.leafletObject.tap) map.value.leafletObject.tap.disable();
  map.value.root.style.cursor = 'default';
}


defineExpose({ updateGeoJson, isReady, disableInteraction, enableInteraction })
</script>

<template>


  <div>
    <KeepAlive>
      <LMap ref="map" :zoom="zoom" :center="center" :use-global-leaflet="true" @ready="onMapReady">

        <div
          class="[perspective:1000px] [transform-style:preserve-3d] w-full absolute z-[1001] !aspect-[3/2]">
          <span
            class="w-1/2 h-full bg-gray-500 absolute left-0 z-[1001] transition-transform duration-[200ms] -translate-x-3/4 rotate-y-120 border-solid border-black border-r"
            :class="cn(!props.hide && '!translate-x-0 !rotate-y-0')"></span>
          <Icon name="mdi:lock" size="5rem"
            class="z-[1003] absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full scale-0"
            :class="cn(!props.hide && 'transition-transform duration-[200ms] -translate-x-1/2 top-1/2 !scale-100 !-translate-y-1/2')" />
          <span
            class="w-1/2 h-full bg-gray-500 absolute right-0 z-[1002] transition-transform duration-[200ms] translate-x-3/4 rotate-y-60 border-solid border-black border-l"
            :class="cn(!props.hide && '!translate-x-0 !rotate-y-0')"></span>
        </div>

        <div class="largeMap:hidden w-full h-full bg-white dark:bg-gray-500 z-[1001] absolute" v-show="!hide">
        </div>

        <LTileLayer :url="tileMapUrl"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          layer-type="base" name="OpenStreetMap" />

        <LGeoJson v-if="geojson" :geojson="geojson" :geostyler="geostyler" />
      </LMap>
    </KeepAlive>
  </div>
</template>
