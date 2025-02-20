<script setup lang="ts">
import L from "leaflet"

const zoom = ref(6);
const center = ref([47.21322, -1.559482])

interface WorldMapProps {
    ccn3?: string;
}

const props = defineProps<WorldMapProps>();

const tileMapUrl = "http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"

const geojson = ref<GeoJSON.GeoJSON|undefined>(undefined)
const geostyler = (feature: any) => ({
    opacity: feature.properties.code / 100_000
})

async function setGeoJson(ccn3: string) {
  if (!ccn3) return;

  const response = await $fetch(`/api/geojson/${ccn3}`);
  geojson.value = response;

    console.log("Set geoJson")

  if (map.value) {
    nextTick(() => {
      if (geojson.value) {
        map.value!.leafletObject.fitBounds(L.geoJSON(geojson.value).getBounds());
      }
    });
  }
}


onMounted(async () => {
    if (props.ccn3) {
        await setGeoJson(props.ccn3)
    }
})

const map = ref<{leafletObject: L.Map}|null>(null)

defineExpose({setGeoJson})

</script>


<template>   
    <LMap ref="map" :zoom="zoom" :center="center" :use-global-leaflet="true">
        <LTileLayer :url="tileMapUrl"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            layer-type="base" name="OpenStreetMap" />

        <LGeoJson v-if="geojson" :geojson="geojson" :geostyler="geostyler" />
    </LMap>
</template>
