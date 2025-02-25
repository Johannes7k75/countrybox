<script lang="ts" setup>
definePageMeta({
  middleware: ["authenticated"],
});

const boxes = (await $fetch("/api/boxes", { method: "POST" })) ?? [];

console.log(boxes);
</script>

<template>
  <div class="flex h-full w-full flex-row items-center justify-center gap-8">
    <div
      v-for="box of boxes"
      :key="box!.phase"
      class="flex w-max flex-col items-center"
    >
      <div
        class="relative flex h-20 w-12 items-center justify-center rounded-xl bg-gray-700 [font-size:32px]"
      >
        <span class="z-[5]">{{ box!.phase }}</span>
        <div
          class="absolute bottom-0 z-[3] h-1/2 w-full rounded-[inherit] rounded-t-[0] bg-green-500"
        ></div>
      </div>

      <span>{{ box!.flagIds.length }}</span>
    </div>
  </div>
</template>
