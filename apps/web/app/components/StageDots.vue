<script setup lang="ts">
defineProps<{ stage: number }>()
const { t } = useT()
</script>
<template>
  <span class="dots" role="img" :aria-label="`${t('common.stage')} ${stage} ${t('common.of')} 5`"
    ><i v-for="n in 5" :key="n" :class="{ on: n <= stage }"
  /></span>
</template>
