<script lang="ts" setup>

defineEmits<{
  closeModal: []
}>()

</script>
    
<template>
  <!-- Modal overlay -->
  <div class="z-20 fixed top-0 bottom-0 left-0 right-0 flex justify-center bg-[#000000da]" @click="$emit('closeModal')">

    <!-- Modal -->
    <div class="text-center bg-white h-[500px] w-[500px] mt-[10%] py-[60px] rounded-xl flex flex-col items-center"  @click.stop>
      <Icon name="mdi:reload" size="10rem"/>

      <button class="bg-[#ac003e] px-4 py-1 text-white [font-size:2rem] rounded-2xl" @click="console.log('Neustarten')">
          Neustarten
      </button>
    </div>

    <!-- Close -->
    <div class="cursor-pointer mt-[10%] ml-2" @click="$emit('closeModal')">
      <div class="rounded-full bg-red-400 h-[42px]">
        <Icon name="mdi:close-circle-outline" size="42px" />
      </div>
    
    </div>
  </div>
</template>


<style></style>