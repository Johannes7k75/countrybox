<script setup lang="ts">
import "flag-icons/css/flag-icons.min.css";
import { cn } from "~~/lib/utils";

defineRouteRules({
  prerender: true,
});

const { data: countryTlds } = await useLazyAsyncData("country:tlds", async () => {
  const tlds = await $fetch("/api/v2/tlds/");
  return new Map(tlds.map(({ countryId, tld }) => [countryId, tld]));
});

const { data: flagCodes, status } = await useLazyAsyncData("flagCodes", () => $fetch("/api/v2/flags"));
const isPending = computed(() => status.value === "pending");

const filter = reactive({
  onlyUN: false,
});

function updateQuery() {
  console.log("Update params");

  const mappedParams = (Object.keys(filter) as (keyof typeof filter)[]).reduce((p, c) => (filter[c] ? Object.assign(p, { [c]: filter[c] }) : p), {});

  useRouter().replace({
    query: !mappedParams ? {} : mappedParams,
  });
}

const query = ref("");

function normalizeString(inputString: string) {
  if (!inputString) return "";

  return inputString
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function searchFor(strA: string, strB: string) {
  return normalizeString(strA).includes(normalizeString(strB));
}

const flags = computed(() => {
  if (isPending.value) return [];

  const filtered = flagCodes
    .value!.filter((flag) =>
      query.value != ""
        ? searchFor(flag.capital, query.value) || searchFor(flag.name, query.value) || searchFor(countryTlds.value?.get(flag.id)!, query.value) || searchFor(`+${flag.callingCode}`, query.value)
        : // || searchFor(flag.callCode, query.value)
          true,
    )
    .filter((flag) => (filter.onlyUN ? flag.unMember : true));
  return filtered;
});

const isFlipped = ref<string>();

onMounted(async () => {
  (Object.keys(filter) as (keyof typeof filter)[]).forEach((f) => {
    if (typeof filter[f] === "boolean") {
      filter[f] = useRoute().query[f] === "true";
    }
  });
});
</script>

<template>
  <div class="no-scrollbar mx-auto mt-0 mb-auto max-h-full w-full overflow-y-scroll p-2 pb-16 lg:max-w-[70rem]">
    <UButton variant="subtle" label="Home" icon="mdi:home" to="/" view-transition class="rounded-sm text-(--text)" size="xl" />

    <div class="flex flex-col items-center">
      <div class="flex w-max flex-col">
        <div class="flex w-full justify-between">
          <label for="search">Land oder Stadt</label>
          <span class="text-black/50 dark:text-white/50">({{ flags.length }})</span>
        </div>

        <div class="flex flex-row">
          <UInput type="text" name="search" placeholder="Deutschland" v-model="query" class="mb-8" />

          <UPopover>
            <UButton icon="mdi:filter" class="mx-1 h-max" />

            <template #content>
              <div class="h-16 max-w-60 bg-(--ui-bg-accented)/40 p-2 pr-4">
                <USwitch label="UN Mitglied" v-model="filter.onlyUN" @update:model-value="updateQuery" />
              </div>
            </template>
          </UPopover>
        </div>
      </div>

      <div class="mx-auto grid w-max grid-cols-2 gap-8 max-sm:w-full max-sm:max-w-[100vw] max-sm:overflow-x-hidden max-sm:p-4 lg:grid-cols-4">
        <template v-if="isPending">
          <USkeleton v-for="flag of 4" class="[aspect-ratio:4/3] sm:w-[240px]" />
        </template>
        <template v-else>
          <div
            v-for="flag in flags"
            :key="flag.cca2"
            class="inline-block [aspect-ratio:4/3] cursor-pointer [perspective:1000px] sm:w-[240px]"
            @click="isFlipped === flag.cca2 ? (isFlipped = undefined) : (isFlipped = flag.cca2)"
          >
            <div class="group relative h-full w-full [transform-style:preserve-3d]">
              <!-- Front -->
              <div class="card-face bg-white transition-transform duration-[700ms]" :class="isFlipped === flag.cca2 && '[transform:rotateX(180deg)]'">
                <!-- <img :src="flag.path" class="w-full h-full rounded-2xl object-cover" /> -->

                <span :class="cn('fi h-full !w-full rounded-md', `fi-${flag.cca2}`)"></span>
              </div>

              <!-- Back -->
              <div
                class="card-face relative [transform:rotateX(180deg)] bg-[#1a202c] text-center text-white transition-transform duration-[700ms]"
                :class="isFlipped === flag.cca2 && '[transform:rotateX(360deg)]'"
              >
                <div class="relative flex h-full w-full items-center [font-size:16px]">
                  <!-- <img :src="flag.path"
                                class="w-10 h-[30px] object-contain absolute top-2 left-2 border border-solid border-white rounded-sm" /> -->
                  <span :class="cn('fi !absolute top-2 left-2 [aspect-ratio:4/3] !w-10 rounded-sm border border-solid border-white', `fi-${flag.cca2}`)"></span>

                  <span :class="cn('!absolute bottom-2 left-2 rounded-md bg-white/25 px-2 py-1 text-white/80')">
                    {{ countryTlds?.get(flag.id) }}
                  </span>

                  <span :class="cn('!absolute right-2 bottom-2 rounded-md bg-white/25 px-2 py-1 text-white/80')" v-show="flag.callingCode && flag.callingCode != ''"> +{{ flag.callingCode }} </span>

                  <div class="mx-auto my-auto">
                    <h3>{{ flag.name }}</h3>
                    <p>{{ flag.capital }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- <img :src="path" /> -->
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style>
.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
</style>
