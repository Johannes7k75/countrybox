<script setup lang="ts">
import { GameLink } from '#components';

definePageMeta({
  middleware: ['authenticated'],
})
</script>

<template>
  <Header />

  <div class="flex items-center flex-col mt-10">
    <ul class="flex items-center flex-col gap-4 w-max">
      
      <GameLink to="/game" :name="$t('main.titles.flags')" :sub-name="$t('main.types.play')" />
      <GameLink to="/game-select" :name="$t('main.titles.customGame')" :sub-name="$t('main.types.play')" />
      <GameLink to="/flags" :name="$t('main.titles.click&learn')" :sub-name="$t('main.types.train')" />
      <GameLink to="/boxes" :name="$t('main.titles.flagBox')" :sub-name="$t('main.types.learn')" />
      
    </ul>
  </div>
</template>
