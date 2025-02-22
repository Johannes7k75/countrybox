<script lang="ts" setup>
const props = defineProps<{
  selectedType: GameTypes;
  disabledType: GameTypes;
  updateType: (type: GameTypes) => void;
}>();
</script>

<template>
  <div class="w-full flex justify-center gap-2 mt-2">
    <UButton 
      v-for="type in gameTypes" 
      :key="type"
      :label="$t(`game.typeSelect.${type}`)" 
      :color="selectedType === type ? 'green' : 'gray'"
      @click="updateType(type)" 
      :disabled="disabledType === type" 
    />
  </div>
</template>
