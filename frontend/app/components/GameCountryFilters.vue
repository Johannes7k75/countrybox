<script setup lang="ts">
const countries = await useFetch("/api/v2/flags/");

const independent = ref(false);
const unMembers = ref(false);

const countrySelector = useTemplateRef("subregionsTree");


function selectUnMembers(value?: boolean) {
  console.log(unMembers.value, value)
  unMembers.value = value==undefined? !unMembers.value: value
  const unCountries = (countries.data.value??[]).filter(c=> unMembers.value ? c.unMember : true)
  const nonUnCountries = (countries.data.value??[]).filter(c=> unMembers.value ? !c.unMember : false)

  unCountries.forEach(c=>countrySelector.value.setCountry(c.region, c.subregion, c.name, true))
  nonUnCountries.forEach(c=>countrySelector.value.setCountry(c.region, c.subregion, c.name, false))
}

const filteredRegions = computed(() => (countries.data.value ?? [])
    .filter((c) => countrySelector.value?.data.get(c.region)?.get(c.subregion)?.get(c.name))
    .filter((c) => (independent.value ? c.independent : true))
    .filter((c) => (unMembers.value ? c.unMember : true))
);
</script>

<template>
  <UModal :default-open="false">
    <UButton label="Filter" color="accent" icon="mdi:filter" class="cursor-pointer text-(--text)" />

    <template #content>
      <div class="p-4">
        <div class="flex flex-col space-y-1">
          <h1>
            Regionen Filter
            <span class="text-(--text)/70">{{ filteredRegions?.length }}/{{ countries.data.value?.length }}</span>
          </h1>

          <RegionSelector :countries="countries.data.value ?? []" ref="subregionsTree" />
        </div>

        <USeparator class="my-4" />
        <div class="mt-4 flex flex-row items-center gap-2">
          <USwitch label="Nur UN Mitglieder" v-model="unMembers" @update:model-value="(v)=>selectUnMembers(v)" />
        </div>
      </div>
    </template>
  </UModal>
</template>