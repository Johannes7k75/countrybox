<template>
  <WorldMap
    ref="worldMapRef"
    :cca3="correctOption?.cca3"
    class="my-auto !aspect-[3/2] !max-w-[37rem]"
    :class="
      cn(
        !mapVisible
          ? 'max-largeMap:-translate-x-[100vw]'
          : 'max-largeMap:translate-x-0',
      )
    "
    v-if="showCountry !== 'off'"
    :hide="mapVisible"
  />
</template>

<script lang="ts" setup>
import WorldMap from '../WorldMap.vue';
import { cn } from '~~/lib/utils';

defineProps<{
  correctOption: any;
  showCountry: string;
  mapVisible: boolean;
}>();

const worldMapRef = ref<{
  updateGeoJson: (ccn3: string) => Promise<void>;
  isReady: boolean;
  enableInteraction: () => void;
  disableInteraction: () => void;
}>();
</script>
