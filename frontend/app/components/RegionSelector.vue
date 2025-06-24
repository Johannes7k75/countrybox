<script lang="ts" setup>
import type { Country } from '~~/shared/database';

const props = defineProps<{ countries: Country[] }>();

// Use reactive instead of ref to ensure reactivity
const subregionsTree = ref(new Map<string, Map<string, Map<string, boolean>>>())

function every<T extends number|string>(data: T[], predicate: (value: T, index: number)=>boolean) {
    let index = 0;
    for (const n of data) {
        if (!predicate(n, index++)) return false
    }
    return true
}
function some<T extends number|string>(data: T[], predicate: (value: T, index: number)=>boolean) {
    let index = 0;
    for (const n of data) {
        if (predicate(n, index++)) return true
    }
    return false
}


function getCountryEvery(region: string, subregion: string, name: string) {
  return subregionsTree.value.get(region)?.get(subregion)?.get(name) ?? false;
}
function getSubregionEvery(region: string, subregion: string) {
    return every([...subregionsTree.value.get(region)!.get(subregion)!.keys()], (cKey)=>getCountryEvery(region,subregion,cKey))
}
function getRegionEvery(region: string) {
    return every([...subregionsTree.value.get(region)!.keys()], (sKey)=>getSubregionEvery(region,sKey))
}

function getCountrySome(region: string, subregion: string, name: string) {
  return subregionsTree.value.get(region)?.get(subregion)?.get(name) ?? false;
}
function getSubregionSome(region: string, subregion: string) {
    return some([...subregionsTree.value.get(region)!.get(subregion)!.keys()], (cKey)=>getCountrySome(region,subregion,cKey))
}
function getRegionSome(region: string) {
    return some([...subregionsTree.value.get(region)!.keys()], (sKey)=>getSubregionSome(region,sKey))
}


function setCountry(region: string, subregion: string, name: string, value: boolean) {
  if (!subregionsTree.value.has(region)) {
    subregionsTree.value.set(region, new Map());
  }
  if (!subregionsTree.value.get(region)!.has(subregion)) {
    subregionsTree.value.get(region)!.set(subregion, new Map());
  }
  subregionsTree.value.get(region)!.get(subregion)!.set(name, value);
}
function setSubregion(regionKey: string, subregionKey: string, value: boolean) {
    const subregion = subregionsTree.value.get(regionKey)?.get(subregionKey)
    for (const cKey of subregion?.keys()??[]) {
        setCountry(regionKey, subregionKey, cKey, value)
    }
}
function setRegion(regionKey: string, value: boolean) {
    const region = subregionsTree.value.get(regionKey)
    for (const sKey of region?.keys() ?? []) {
        setSubregion(regionKey, sKey, value)        
    }
}


// Populate the tree from the countries list
props.countries.forEach((c) => {
  setCountry(c.region, c.subregion, c.name, true);
});

const openRegions = ref(new Set());

function toggleRegion(key: string) {
  if (openRegions.value.has(key)) {
    openRegions.value.delete(key);
  } else {
    openRegions.value.add(key);
  }
}

function isRegionOpen(key: string) {
  return openRegions.value.has(key);
}

const regionIcons = computed(() => {
  const regions = subregionsTree.value;
  const icons: Record<string, string> = {};

  for (const [rKey, subregions] of regions) {
    icons[rKey] = getRegionIcon(rKey);
    for (const [sKey] of subregions) {
      icons[`${rKey}-${sKey}`] = getRegionIcon(rKey, sKey);
    }
  }
  return icons;
});

function getRegionIcon(region: string, subregion?: string) {
  const regionMap = subregionsTree.value.get(region);
  if (subregion) {
    const subregionMap = regionMap?.get(subregion);
    if (subregionMap && [...subregionMap.values()].every(Boolean)) {
      return "mdi:check";
    } else if (subregionMap && [...subregionMap.values()].some(Boolean)) {
      return "mdi:minus";
    } else {
      return "";
    }
  } else {
    if (regionMap && [...regionMap.values()].every((sub) => [...sub.values()].every(Boolean))) {
      return "mdi:check";
    } else if (regionMap && [...regionMap.values()].some((sub) => [...sub.values()].some(Boolean))) {
      return "mdi:minus";
    } else {
      return "";
    }
  }
}

defineExpose({data:subregionsTree, setCountry})

</script>

<template>
  <div v-for="[regionKey, regionMap] in [...subregionsTree]" :key="regionKey">
    <UCollapsible :open="isRegionOpen(regionKey)">
      <div class="flex items-center">
        <UButton :icon="isRegionOpen(regionKey) ? 'mdi:chevron-down' : 'mdi:chevron-right'" variant="ghost" class="cursor-pointer p-1 hover:!bg-[unset]" @click="toggleRegion(regionKey)" />
        <UCheckbox :label="regionKey" :icon="regionIcons[regionKey]" 
            :model-value="getRegionSome(regionKey)"
            @update:model-value="(v)=>setRegion(regionKey, v as boolean)" 
        />
      </div>

      <template #content>
        <div v-for="[subregionKey, subregionMap] in [...regionMap]" :key="subregionKey">
          <UCollapsible :open="isRegionOpen(`${regionKey}-${subregionKey}`)">
            <div class="flex items-center pl-5">
              <UButton
                :icon="isRegionOpen(`${regionKey}-${subregionKey}`) ? 'mdi:chevron-down' : 'mdi:chevron-right'"
                variant="ghost"
                class="cursor-pointer p-1 hover:!bg-[unset]"
                @click="toggleRegion(`${regionKey}-${subregionKey}`)"
              />
              <UCheckbox :label="subregionKey" :icon="regionIcons[`${regionKey}-${subregionKey}`]"
              :model-value="getSubregionSome(regionKey, subregionKey)"
               @update:model-value="(v)=>setSubregion(regionKey, subregionKey, v as boolean)" 
               />
            </div>

            <template #content>
              <div class="flex flex-col pl-15">
                <UCheckbox
                  v-for="[name, val] in [...subregionMap]"
                  :label="name"
                  :model-value="val"
                  @update:model-value="(value) => setCountry(regionKey, subregionKey, name, value as boolean)"
                  :key="name"
                />
              </div>
            </template>
          </UCollapsible>
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
