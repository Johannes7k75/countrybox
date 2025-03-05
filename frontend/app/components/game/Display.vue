<template>
  <div
    class="max-largeMap:p-4 flex flex-grow flex-col content-center justify-center"
  >
    <span
      :class="
        cn(
          correctGuessed && 'large text-green-500',
          'text-center text-4xl font-bold',
        )
      "
      v-show="!isGameOver && !isRoundOver"
    >
      <template v-if="types.first === 'flag'">
        <span
          :class="cn('fi', `fi-${displayValue}`)"
          class="[aspect-ratio:4/3] !h-full rounded-md transition-opacity duration-200 sm:!h-56 sm:!w-full"
        ></span>
      </template>
      <template v-else>
        {{ displayValue }}
      </template>
    </span>
  </div>
</template>

<script lang="ts" setup>
import { cn } from '~~/lib/utils';

const {correctGuessed,isGameOver,isRoundOver,types} = storeToRefs(useGameStore())

defineProps<{
  displayValue: string;
}>();
</script>
