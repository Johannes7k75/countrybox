<template>
  <div
    class="col-start-2 mt-auto grid h-max w-full max-w-full grid-cols-2 grid-rows-2 gap-8 rounded-md rounded-b-none bg-(--ui-primary)/20 p-4 ring ring-(--ui-primary)/35 ring-inset max-sm:gap-3"
  >
    <div
      v-for="option of options"
      :key="option.cca2"
      @click="useGameStore().guess(option.cca2)"
      class="relative flex [aspect-ratio:4/3] !w-full cursor-pointer items-center rounded-md"
      :class="
        cn(
          types.second !== 'flag' && 'bg-gray-600/70',
          types.second !== 'flag' && correctGuessed && 'bg-green-500',
          (showFlagOverlay(option) || isGameOver) && 'bg-gray-600/40',
        )
      "
    >
      <div
        class="absolute h-full w-6 content-center text-center max-sm:hidden"
        :class="cn(getIndex(option) % 2 == 0 ? '-left-10' : '-right-10')"
      >
        <span
          class="bg-accent-500 h-4 w-8 rounded-md p-2 font-semibold text-gray-900/80"
          :class="
            cn(getIndex(option) % 2 == 0 ? 'rounded-r-none' : 'rounded-l-none')
          "
        >
          {{ getIndex(option) + 1 }}
        </span>
      </div>

      <template v-if="types.second === 'flag'">
        <span
          :class="
            cn(
              'fi',
              `fi-${option.cca2}`,
              (showFlagOverlay(option) || correctGuessed) &&
                useGameStore().isNotCorrect(option.cca2) &&
                'opacity-40',
            )
          "
          class="[aspect-ratio:4/3] !w-full rounded-md transition-opacity duration-200 sm:!h-56"
        />
        <div
          v-show="
            useGameStore().isNotCorrect(option.cca2) &&
            (correctGuessed || isGuessed(option.cca2))
          "
          class="absolute top-2 right-1 rounded-md bg-gray-600/50 p-1"
        >
          {{ option.name }}
        </div>
        <div
          v-show="isCorrect(option.cca2) && correctGuessed && !autoNext"
          class="bg-background-800/80 absolute left-1/2 -translate-x-1/2 transform rounded-md p-1 text-lg text-(--text) select-none"
        >
          Press to continue
        </div>
      </template>
      <template v-else>
        <span
          :class="cn((showFlagOverlay(option) || isGameOver) && 'opacity-40')"
          class="!w-full text-center text-2xl text-(--text) transition-opacity duration-200"
        >
          {{ option[types.second] }}
        </span>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import "flag-icons/css/flag-icons.min.css";
import { cn } from "~~/lib/utils";

const { correctGuessed, options, types, isGameOver } =
  storeToRefs(useGameStore());
const { getIndex, isCorrect, isGuessed } = useGameStore();

defineProps<{
  showFlagOverlay: (option: any) => boolean;
  autoNext: boolean;
}>();
</script>
