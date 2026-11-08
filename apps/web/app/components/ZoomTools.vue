<script setup lang="ts">
defineEmits<{ in: []; out: []; reset: [] }>()
const { t } = useT()
</script>
<template>
  <div class="clickmap-tools">
    <button type="button" class="icon-btn" :aria-label="t('map.zoomIn')" @click="$emit('in')">
      <Icon name="plus" />
    </button>
    <button type="button" class="icon-btn" :aria-label="t('map.zoomOut')" @click="$emit('out')">
      <Icon name="minus" />
    </button>
    <button type="button" class="icon-btn" :aria-label="t('map.resetView')" @click="$emit('reset')">
      <Icon name="restart" />
    </button>
  </div>
</template>
