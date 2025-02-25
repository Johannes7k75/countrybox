<script setup lang="ts">
import "flag-icons/css/flag-icons.min.css";
import { cn } from "~~/lib/utils";

const mapping = {
  name: "name",
  capital: "capital",
  code: "cca3",
  cca2: "cca2",
  countryId: "id",
  callCode: "callingCode",
};

const flagCodes = await $fetch<(typeof mapping)[]>("/api/flags", {
  method: "GET",
  params: mapping,
});

const query = ref("");

function normalizeString(inputString: string) {
  return inputString
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function searchFor(strA: string, strB: string) {
  return normalizeString(strA).includes(normalizeString(strB));
}

const flags = computed(() => {
  const filtered = flagCodes.filter((flag) =>
    query.value != ""
      ? searchFor(flag.capital, query.value) ||
        searchFor(flag.name, query.value)
      : true,
  );
  return filtered;
});

const flagMap = computed(() => {
  const map = new Map();
  flagCodes
    .filter(({ capital, name }) =>
      query.value != ""
        ? capital.toLowerCase().includes(query.value.toLowerCase()) ||
          name.toLowerCase().includes(query.value.toLowerCase())
        : true,
    )
    .forEach(({ code, countryId }) => map.set(countryId, code));

  return map;
});

const isFlipped = ref<string>();

console.log(flagMap.value);

const tldMap = new Map<string, string>();
onMounted(async () => {
  const tlds = await $fetch("/api/flags/tlds", {
    method: "POST",
    body: {
      countries: flags.value.map((flag) => flag.code),
    },
  });

  tlds.forEach((tld) => {
    console.log(tldMap.values().filter((x) => x == tld.tld));
    tldMap.set(flagMap.value.get(tld.countryId), tld.tld);
  });

  console.log(tldMap);
});
</script>

<template>
  <div class="mt-0 mb-auto max-h-full w-full overflow-y-scroll pb-16">
    <NuxtLink
      to="/"
      class="mt-4 ml-4 flex w-max flex-row border border-solid border-gray-400 px-2 py-1 pl-1 hover:bg-gray-500/20"
    >
      <Icon name="mdi:home" size="24px" />Home
    </NuxtLink>

    <div class="flex flex-col items-center">
      <div class="flex w-max flex-col">
        <div class="flex w-full justify-between">
          <label for="search">Land oder Stadt</label>
          <span class="text-black/50 dark:text-white/50"
            >({{ flags.length }})</span
          >
        </div>

        <UInput
          type="text"
          name="search"
          placeholder="Deutschland"
          v-model="query"
          class="mb-8"
        />
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
                  {{ tldMap.get(flag.code) }}
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
