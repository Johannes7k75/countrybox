<script lang="ts" setup>
definePageMeta({
  middleware: ["user-only"],
});

const {data: countryNames} = await useLazyAsyncData("country:names", async()=>{
  const names = await $fetch("/api/v2/flags/names")
  return new Map(names.map(({cca3, name})=>([cca3, name])))
})

const {data: countryTlds} = await useLazyAsyncData("country:tlds", async()=>{
  const tlds = await $fetch("/api/v2/tlds/")
  return new Map(tlds.map(({countryId, tld})=>([countryId.toString(),tld])))
})


// const boxes = await $fetch("/api/v2/boxes", { method: "GET",  });
const { data: boxes, status } = await useLazyAsyncData('boxes', () => $fetch("/api/v2/boxes", { method: "GET", }))

const isPending = computed(() => status.value === "pending")

const allFlagsCount = computed(() => (boxes.value ?? []).reduce((p, box) => p + box.flagIds.length, 0))

const modalOpen = reactive<Record<string, boolean>>({})

console.log(boxes, useCountry().getName("deu"));
</script>

<template>
  <div class="flex h-full w-full flex-row items-center justify-center gap-8">

    <template v-if="isPending">
      <div class="flex w-max flex-col items-center" v-for="box in 6">

        <USkeleton
          class="relative flex h-20 w-12 items-center justify-center rounded-xl bg-gray-700 [font-size:32px] cursor-pointer">
          <span class="z-[5]">{{ box + 1 }}</span>
        </USkeleton>

        0
      </div>
    </template>
    <template v-else>
      <div class="flex w-max flex-col items-center" v-for="box of boxes" :key="box.phase">
        <UModal v-model:open="modalOpen[box.id]">
          <div
            class="relative flex h-20 w-12 items-center justify-center rounded-xl bg-gray-700 [font-size:32px] cursor-pointer">
            <span class="z-[5]">{{ box.id + 1 }}</span>
            <div class="absolute bottom-0 z-[3] w-full rounded-[inherit] rounded-t-[0] bg-green-500"
              :style="{ height: `${Math.round((box.flagIds.length / allFlagsCount) * 100)}%` }"></div>
          </div>

          <template #content>
            <UCard :ui="{ header: 'bg-(--accent) rounded-t-[inherit] pb-2' }">
              <template #header class="bg-(--accent) w-full ">
                <div>
                  {{ $t("boxes.box.title", { boxNumber: box.id + 1 }) }}
                </div>
              </template>

              <div class="flex flex-col overflow-y-scroll max-h-100">
                <span v-for="flagId of box.flagIds">{{ useFlagNames().value.get(flagId) }}</span>
              </div>

              <template #footer>
                <div class="text-right text-(--secondary)">
                  <span @click="modalOpen[box.id] = false" class="font-semibold cursor-pointer">
                    {{ $t("boxes.box.back") }}
                  </span>
                </div>
              </template>
            </UCard>
          </template>
        </UModal>

        <span>{{ box!.flagIds.length }}</span>
      </div>
    </template>
  </div>
</template>
