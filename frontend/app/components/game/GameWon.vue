<template>
    <div
    class="flex flex-grow flex-col content-center items-center justify-center text-8xl font-bold text-green-500 max-sm:text-5xl"
    v-show="isGameWon"
  >
    <span>Game won</span>
  </div>
</template>

<script lang="ts" setup>
defineProps<{isGameWon: boolean}>()
</script>