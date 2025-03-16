<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import { cn } from "~~/lib/utils";

const props = defineProps<{ type: GameTypes; secondType: GameTypes, update:(newType: GameTypes)=>void }>();

const firstType = toRef(()=>props.type)
const secondType = toRef(()=>props.secondType)

const placeholder = await $fetch("/api/flags/de");
const tld = await $fetch("/api/data/tld/de");

const isFlag = computed(() => props.type === "flag");

const label = computed(() => {
  switch (props.type) {
    case "name":
      return placeholder?.name;
    case "capital":
      return placeholder?.capital;
    case "tld":
      return tld[0]?.tld ?? "";
    case "callCode":
      return `+${placeholder?.callingCode}`;
    case "flag":
      return placeholder?.cca2;
  }
});

const items = computed(() =>
  gameTypes.map(
    (type) =>
      ({
        label: useI18n().t(`game.typeSelect.${type}`),
        disabled: type === secondType.value,
        active: type === firstType.value,
        onSelect(e) {
            props.update(type)
        },
      }) as DropdownMenuItem,
  ),
);
</script>

<template>
  <div class="relative leading-4" :class="cn(isFlag && 'mx-auto w-1/2', !isFlag && 'w-1/2 mx-auto !aspect-[4/3] content-center')">
    <span :class="isFlag && `fi fi-${label} !aspect-[4/3] !w-full`">{{ !isFlag ? label : "" }}</span>
    <LazyUDropdownMenu :items>
      <UButton icon="mdi:pencil" size="sm" class="absolute top-0 right-0 m-1" />
    </LazyUDropdownMenu>
  </div>
</template>
