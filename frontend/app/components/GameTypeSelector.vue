<script lang="ts" setup>
const props = defineProps<{
  selectedType: GameTypes;
  disabledType: GameTypes;
  updateType: (type: GameTypes) => void;
}>();
</script>

<template>
  <div class="mb-2 flex w-full justify-center gap-2">
    <UButton
      v-for="type in gameTypes"
      :key="type"
      :label="$t(`game.typeSelect.${type}`)"
      :color="selectedType === type ? 'primary' : 'secondary'"
      @click="updateType(type)"
      :disabled="disabledType === type"
    />
  </div>
</template>
