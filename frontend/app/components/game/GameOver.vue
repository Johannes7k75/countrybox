<template>
  <div
    class="flex flex-grow flex-col content-center items-center justify-center text-8xl font-bold text-red-500 max-sm:text-5xl"
    v-show="isGameOver"
  >
    <span>Game over</span>
    <button
      @click.prevent="reloadWindow"
      class="flex cursor-pointer items-center justify-center rounded-2xl bg-red-500 px-4 py-2 text-white"
    >
      <Icon name="mdi:reload" /> Neustarten
    </button>
  </div>
</template>

<script lang="ts" setup>
const {isGameOver} = storeToRefs(useGameStore())

function reloadWindow() {
  useGameStore().startGame({
    maxFails: 3,
    maxRounds: 20,
    types: useGameStore().types,
  });
}
</script>
