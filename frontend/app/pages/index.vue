<script setup lang="ts">
import { GameLink } from "#components";

defineRouteRules({
  prerender: true
})

const currentUser = useAuthUser()

</script>

<template>
  <Header :user="currentUser" />

  <div class="mt-10 flex flex-col items-center">
    <ul class="flex w-max flex-col items-center gap-4">
      <GameLink
        to="/game"
        :name="$t('main.titles.flags')"
        :sub-name="$t('main.types.play')"
      />
      <GameLink
        to="/game-select"
        :name="$t('main.titles.customGame')"
        :sub-name="$t('main.types.play')"
      />
      <GameLink
        to="/flags"
        :name="$t('main.titles.click&learn')"
        :sub-name="$t('main.types.train')"
      />
      <GameLink
        to="/boxes"
        :locked="true"
        :name="$t('main.titles.flagBox')"
        :sub-name="$t('main.types.learn')"
      />
    </ul>
  </div>
</template>
