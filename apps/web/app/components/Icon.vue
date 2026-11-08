<script setup lang="ts">
import { ICONS, type IconName } from '~/utils/icons'
defineProps<{ name: IconName }>()
</script>
<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <svg
    class="ic"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="ICONS[name]"
  />
</template>
