<script lang="ts" setup>

interface LinkProps {
  to: string
  name: string
  subName?: string
}

const props = defineProps<LinkProps>()

</script>
    
<template>
  <!-- <li class="w-full py-2 px-4 rounded-sm border border-solid border-gray hover:bg-slate-500/20 text-center"> -->
    
    <UButton class="flex flex-col text-(--text) w-full py-2 px-4 rounded-sm" :to="props.to" variant="subtle">
      <span class="text-xl">{{ props.name }}</span>
        <span>{{ props.subName }}</span>
    </UButton>

    <!-- <NuxtLink :to="props.to">
      <div class="flex flex-col">
        <span class="text-xl">{{ props.name }}</span>
        <span>{{ props.subName }}</span>
      </div>
    </NuxtLink> -->
  <!-- </li> -->
</template>