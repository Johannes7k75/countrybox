<script setup lang="ts">
// const regionTree = {
//   Americas: ["Caribbean", "South America", "Central America", "North America"],
//   Asia: [
//     "Southern Asia",
//     "Western Asia",
//     "South-Eastern Asia",
//     "Eastern Asia",
//     "Central Asia",
//   ],
//   Africa: [
//     "Middle Africa",
//     "Eastern Africa",
//     "Western Africa",
//     "Southern Africa",
//     "Northern Africa",
//   ],
//   Europe: [
//     "Northern Europe",
//     "Southeast Europe",
//     "Southern Europe",
//     "Central Europe",
//     "Western Europe",
//     "Eastern Europe",
//   ],
//   Oceania: [
//     "Polynesia",
//     "Australia and New Zealand",
//     "Melanesia",
//     "Micronesia",
//   ],
//   Antarctic: [],
// };

const countries = await useFetch("/countries");

const independent = ref(false)

const regionsTree = reactive<Record<string, boolean>>({});
const regionsMap = ref<Map<string, { region: string; subregion?: string }>>(
  new Map(),
);

countries.data.value?.forEach((c) => {
  if (!(c.region in regionsTree)) {
    regionsTree[c.region] = true;
  }

  if (c.subregion !== "") {
    const key = `${c.region}-${c.subregion}`;
    regionsMap.value.set(key, { region: c.region, subregion: c.subregion });
    if (!(key in regionsTree)) {
      regionsTree[key] = true;
    }
  }
  regionsMap.value.set(c.region, { region: c.region, subregion: undefined });
});

console.log(regionsMap);

const selectedCountries = computed(() =>
  countries.data.value?.filter(
    ({ region, subregion }) =>
      regionsTree[region] || regionsTree[`${region}-${subregion}`],
  ),
);

const regions = computed(
  () => Object.keys(regionTree) as unknown as (keyof typeof regionTree)[],
);
const subregions = computed(() =>
  regions.value.map((x) => regionTree[x]).reduce((p, c) => p.concat(c), []),
);

const regionTree = reactive({
  Americas: {
    Caribbean: true,
    "South America": true,
    "Central America": true,
    "North America": true,
  },
  Asia: {
    "Southern Asia": true,
    "Western Asia": true,
    "South-Eastern Asia": true,
    "Eastern Asia": true,
    "Central Asia": true,
  },
  Africa: {
    "Middle Africa": true,
    "Eastern Africa": true,
    "Western Africa": true,
    "Southern Africa": true,
    "Northern Africa": true,
  },
  Europe: {
    "Northern Europe": true,
    "Southeast Europe": true,
    "Southern Europe": true,
    "Central Europe": true,
    "Western Europe": true,
    "Eastern Europe": true,
  },
  Oceania: {
    Polynesia: true,
    "Australia and New Zealand": true,
    Melanesia: true,
    Micronesia: true,
  },
  Antarctic: true,
});

function getSelectedSubregions(region: keyof typeof regionsTree) {
  return Object.keys(regionsTree)
    .filter((k) => k.startsWith(region) && k !== region)
    .filter((k) => regionsTree[k]);
}

function getKeyOf<T extends object>(obj: T): keyof T[] {
  return Object.keys(obj) as unknown as keyof T[];
}

function selectRegion(
  regionKey: keyof typeof regionsTree,
  val: boolean | "indeterminate",
) {
  const subregions = Object.keys(regionsTree).filter(
    (k) => k.startsWith(regionKey) && k !== regionKey,
  );

  console.log({ subregions });

  const mappedRegion = regionsMap.value.get(regionKey);

  if (!subregions.includes(regionKey)) {
    console.log("Region")
    subregions.forEach((k) => (regionsTree[k] = val));
    regionsTree[regionKey] = !!val;
  } else {
    console.log("Subregion")
    regionsTree[regionKey] = !!val;

    const subs = Object.keys(regionsTree).filter(
      (k) => k.startsWith(mappedRegion!.region) && k !== mappedRegion!.region,
    );
    regionsTree[mappedRegion!.region] =
      subs.filter((k) => regionsTree[k]).length == subs.length;
  }
}

const filteredRegions = computed(() =>
  countries.data.value?.filter((c) => {
    const key = c.subregion !== "" ? `${c.region}-${c.subregion}` : c.region;
    const mappedRegion = regionsMap.value.get(key);
    return regionsTree[c.region] || regionsTree[key];
  }).filter((c)=>independent.value ? c.independent: true),
);

const openRegions = ref(new Set());
</script>

<template>
  <UModal :default-open="false">
    <UButton
      label="Filter"
      color="accent"
      icon="mdi:filter"
      class="text-(--text) cursor-pointer"
    />

    <template #content>
      <div class="p-4">
        <div class="flex flex-col space-y-1">
          <h1>
            Regionen Filter
            <span class="text-(--text)/70"
              >{{ filteredRegions?.length }}/{{
                countries.data.value?.length
              }}</span
            >
          </h1>
          <template v-for="region in regions" :key="region">
            <UCollapsible
              :open="openRegions.has(region)"
              :default-open="getSelectedSubregions(region).length > 0"
            >
              <div class="flex items-center">
                <UButton
                  :icon="
                    Object.keys(regionsTree).filter(
                      (k) => k.startsWith(region) && k != region,
                    ).length > 0
                      ? openRegions.has(region)
                        ? 'mdi:chevron-down'
                        : 'mdi:chevron-right'
                      : ''
                  "
                  variant="ghost"
                  class="cursor-pointer p-1 hover:!bg-[unset]"
                  @click="
                    openRegions.has(region)
                      ? openRegions.delete(region)
                      : openRegions.add(region)
                  "
                />

                <UCheckbox
                  :label="regionsMap.get(region)?.region"
                  :icon="
                    getSelectedSubregions(region).length ==
                    Object.keys(regionTree[region]).length
                      ? 'mdi:check'
                      : 'mdi:minus'
                  "
                  :default-value="
                    regionsTree[region] ||
                    Object.keys(regionsTree).filter(
                      (k) => k.startsWith(region) && k != region,
                    ).length > 0
                  "
                  @update:modelValue="(e) => selectRegion(region, e)"
                  :modelValue="
                    regionsTree[region] ||
                    Object.keys(regionsTree)
                      .filter((k) => k.startsWith(region) && k != region)
                      .filter((k) => regionsTree[k]).length > 0
                  "
                />
              </div>

              <template #content>
                <div class="space-y-1 pl-10">
                  <UCheckbox
                    v-for="subregion of Object.keys(regionsTree).filter(
                      (k) => k.startsWith(region) && k !== region,
                    )"
                    :key="subregion"
                    :label="regionsMap.get(subregion)?.subregion"
                    @update:modelValue="(e) => selectRegion(subregion, e)"
                    :modelValue="regionsTree[subregion]"
                  />
                </div>
              </template>
            </UCollapsible>
          </template>
        </div>

        <USeparator class="my-4" />

        <div class="mt-4 flex flex-col">
          <USwitch label="Unabhängig" v-model="independent" />
        </div>
      </div>
    </template>
  </UModal>

  <!-- <div>
    <UBadge v-for="filter of filters" :key="filter" :label="filter" />
  </div> -->
</template>
