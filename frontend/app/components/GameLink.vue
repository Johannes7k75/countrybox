<script lang="ts" setup>
import { cn } from '~~/lib/utils';

type LinkProps = {
  to: string;
  name: string;
  subName?: string;
  locked?: boolean;
}

const props = defineProps<LinkProps>();
</script>

<template>
  <!-- <li class="w-full py-2 px-4 rounded-sm border border-solid border-gray hover:bg-slate-500/20 text-center"> -->

  <LazyUTooltip :hidden="true">
    <UButton
    class="flex w-full flex-col rounded-sm px-4 py-2 text-(--text)" :class="cn(locked && '!bg-(--background)')"
    :to="props.to"
    variant="subtle"
    :disabled="locked"
  >
    <span class="text-xl">{{ props.name }}</span>
    <span>{{ props.subName }}</span>
  </UButton>

  <template #content v-if="locked">
    {{ locked }}
    <span>Youre not signed in!</span>
  </template>
  </LazyUTooltip>
</template>
