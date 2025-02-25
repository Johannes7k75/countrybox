<script lang="ts" setup>
defineEmits<{
  closeModal: [];
}>();
</script>

<template>
  <!-- Modal overlay -->
  <div
    class="fixed top-0 right-0 bottom-0 left-0 z-20 flex justify-center bg-[#000000da]"
    @click="$emit('closeModal')"
  >
    <!-- Modal -->
    <div
      class="mt-[10%] flex h-[500px] w-[500px] flex-col items-center rounded-xl bg-white py-[60px] text-center"
      @click.stop
    >
      <Icon name="mdi:reload" size="10rem" />

      <button
        class="rounded-2xl bg-[#ac003e] px-4 py-1 [font-size:2rem] text-white"
        @click="console.log('Neustarten')"
      >
        Neustarten
      </button>
    </div>

    <!-- Close -->
    <div class="mt-[10%] ml-2 cursor-pointer" @click="$emit('closeModal')">
      <div class="h-[42px] rounded-full bg-red-400">
        <Icon name="mdi:close-circle-outline" size="42px" />
      </div>
    </div>
  </div>
</template>

<style></style>
