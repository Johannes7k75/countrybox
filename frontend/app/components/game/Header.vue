<template>
  <div
    class="grid grid-cols-[1fr_max-content_1fr] grid-rows-2 gap-2 px-2 py-4 min-[70rem]:[&>*]:w-[70rem] [&>*]:max-w-[70rem]"
  >
    <div class="min-[70rem]:col-start-2 flex justify-between">
      <UButton
        variant="subtle"
        label="Home"
        icon="mdi:home"
        to="/"
        view-transition
        class="rounded-sm text-(--text)"
        size="xl"
      />
    </div>
    <div class="min-[70rem]:col-start-2 row-start-2 flex items-center justify-between">
      <div class="min-[70rem]:col-start-2">
        <Icon
          v-for="n in lives"
          name="mdi:heart"
          class="text-red-600"
          size="2rem"
        />
        <Icon v-for="n in fails" name="mdi:heart-outline" size="2rem" />
      </div>
      <span class="min-[70rem]:col-start-2 max-[70rem]:hidden col-start-3">{{ round }}/{{ maxRounds }}</span>
    </div>

    <div class="min-[70rem]:hidden row-start-2 col-start-3 flex items-center justify-end">
        <span>{{ round }}/{{ maxRounds }}</span>
    </div>
    
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  lives: number;
  fails: number;
  round: number;
  maxRounds: number;
}>();
</script>
