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
      <GameLink to="/game" name="Flaggen" sub-name="Spiel" />
      
      <GameLink to="/flags" name="Klicken und lernen" sub-name="Üben" />
    </ul>
  </div>
</template>
