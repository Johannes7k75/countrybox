<script>
import { NuxtLoadingIndicator } from "#components";
import "~/assets/css/tailwind.css";
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />
    <div class="h-screen max-h-dvh w-screen">
      <slot />
    </div>
  </UApp>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
