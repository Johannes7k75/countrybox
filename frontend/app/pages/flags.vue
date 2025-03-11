<script setup lang="ts">
import "flag-icons/css/flag-icons.min.css";
import { cn } from "~~/lib/utils";
import type { Country, Tld } from "~~/server/utils/drizzle";

defineRouteRules({
  prerender: true,
});

const mapping = {
  name: "name",
  capital: "capital",
  code: "cca3",
  cca2: "cca2",
  countryId: "id",
  callCode: "callingCode",
  unMember: "unMember",
  independent: "independent",
};

const flagCodes = await $fetch<(typeof mapping)[]>("/api/flags", {
  method: "GET",
  params: mapping,
});

const filter = reactive({
  onlyUN: false
})

function updateQuery() {
  console.log("Update params")

  const mappedParams = (Object.keys(filter) as (keyof typeof filter)[]).reduce((p,c)=> filter[c] ? Object.assign(p,{[c]:filter[c]}): p, {})

  useRouter().replace({
    query: !mappedParams ? {}:mappedParams
  })
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
  const filtered = flagCodes
    .filter((flag) =>
      query.value != ""
        ? searchFor(flag.capital, query.value) ||
          searchFor(flag.name, query.value) ||
          searchFor(tldMap.get(flag.cca2)!, query.value) ||
          searchFor(`+${flag.callCode}`, query.value)
        : // || searchFor(flag.callCode, query.value)
          true,
    )
    .filter((flag) => (filter.onlyUN ? flag.unMember : true));
  return filtered;
});

const flagMap = computed(() => {
  const map = new Map<string, string>();

  flagCodes.forEach(({ countryId, cca2 }) => map.set(countryId, cca2));

  return map;
});

const isFlipped = ref<string>();


const tldMap = new Map<string, string>();
onMounted(async () => {
  (Object.keys(filter) as (keyof typeof filter)[]).forEach((f)=>{
    if (typeof filter[f] === "boolean") {
      filter[f] = useRoute().query[f] === 'true'
    }
    // console.log({[f]: useRoute().query[f]})
  })

  const data = await $fetch<{ tld: Tld; countries: Country }[]>("/tlds", {
    method: "POST",
    body: flags.value.map((flag) => flag.cca2) ?? [],
  });

  data.forEach(({ tld }) => {
    tldMap.set(flagMap.value.get(tld.countryId)!, tld.tld);
  });
});
</script>

<template>
  <div
    class="no-scrollbar mx-auto mt-0 mb-auto max-h-full w-full overflow-y-scroll p-2 pb-16 lg:max-w-[70rem]"
  >
    <UButton
      variant="subtle"
      label="Home"
      icon="mdi:home"
      to="/"
      view-transition
      class="rounded-sm text-(--text)"
      size="xl"
    />

    <div class="flex flex-col items-center">
      <div class="flex w-max flex-col">
        <div class="flex w-full justify-between">
          <label for="search">Land oder Stadt</label>
          <span class="text-black/50 dark:text-white/50"
            >({{ flags.length }})</span
          >
        </div>

        <div class="flex flex-row">
          <UInput
            type="text"
            name="search"
            placeholder="Deutschland"
            v-model="query"
            class="mb-8"
          />

          <UPopover>

            <UButton icon="mdi:filter" class="h-max mx-1" />

            <template #content>
              <div class="bg-(--ui-bg-accented)/40 h-16 max-w-60 p-2 pr-4">

                <USwitch label="UN Mitglied" v-model="filter.onlyUN" @update:model-value="updateQuery" />
              </div>

            </template>

          </UPopover>

        </div>
      </div>

      <div
        class="mx-auto grid w-max grid-cols-2 gap-8 max-sm:w-full max-sm:max-w-[100vw] max-sm:overflow-x-hidden max-sm:p-4 lg:grid-cols-4"
      >
        <div
          v-for="flag in flags"
          :key="flag.code"
          class="inline-block [aspect-ratio:4/3] cursor-pointer [perspective:1000px] sm:w-[240px]"
          @click="
            isFlipped === flag.code
              ? (isFlipped = undefined)
              : (isFlipped = flag.code)
          "
        >
          <div
            class="group relative h-full w-full [transform-style:preserve-3d]"
          >
            <!-- Front -->
            <div
              class="card-face bg-white transition-transform duration-[700ms]"
              :class="isFlipped === flag.code && '[transform:rotateX(180deg)]'"
            >
              <!-- <img :src="flag.path" class="w-full h-full rounded-2xl object-cover" /> -->

              <span
                :class="cn('fi h-full !w-full rounded-md', `fi-${flag.cca2}`)"
              ></span>
            </div>

            <!-- Back -->
            <div
              class="card-face relative [transform:rotateX(180deg)] bg-[#1a202c] text-center text-white transition-transform duration-[700ms]"
              :class="isFlipped === flag.code && '[transform:rotateX(360deg)]'"
            >
              <div
                class="relative flex h-full w-full items-center [font-size:16px]"
              >
                <!-- <img :src="flag.path"
                                class="w-10 h-[30px] object-contain absolute top-2 left-2 border border-solid border-white rounded-sm" /> -->
                <span
                  :class="
                    cn(
                      'fi !absolute top-2 left-2 [aspect-ratio:4/3] !w-10 rounded-sm border border-solid border-white',
                      `fi-${flag.cca2}`,
                    )
                  "
                ></span>

                <span
                  :class="
                    cn(
                      '!absolute bottom-2 left-2 rounded-md bg-white/25 px-2 py-1 text-white/80',
                    )
                  "
                >
                  {{ tldMap.get(flag.cca2) }}
                </span>

                <span
                  :class="
                    cn(
                      '!absolute right-2 bottom-2 rounded-md bg-white/25 px-2 py-1 text-white/80',
                    )
                  "
                  v-show="flag.callCode && flag.callCode != ''"
                >
                  +{{ flag.callCode }}
                </span>

                <div class="mx-auto my-auto">
                  <h3>{{ flag.name }}</h3>
                  <p>{{ flag.capital }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- <img :src="path" /> -->
        </div>
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
