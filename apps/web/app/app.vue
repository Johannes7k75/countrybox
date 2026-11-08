<script setup lang="ts">
const { message, toastText } = useFeedback()
usePrefs()
</script>
<template>
  <a class="skip" href="#main">Skip to content</a>
  <NuxtLayout><NuxtPage /></NuxtLayout>
  <div class="sr-only" role="status" aria-live="polite">{{ message }}</div>
  <div v-if="toastText" class="toast" role="status">{{ toastText }}</div>
</template>
