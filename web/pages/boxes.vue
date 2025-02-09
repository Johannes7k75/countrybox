<script lang="ts" setup>
definePageMeta({
  middleware: ['authenticated'],
})

const boxes = await $fetch("/api/boxes", {method: "POST"}) ?? []

function isTrained(box: boxes[])

</script>

<template>
    <div class="flex flex-row gap-8 items-center w-full justify-center h-full">
        <div v-for="box of boxes" :key="box!.phase" class="flex flex-col w-max items-center">
        <div class="rounded-xl bg-gray-700 w-12 h-20 flex items-center justify-center [font-size:32px] relative">
            <span class="z-[5]">{{box!.phase}}</span>
            <div class="z-[3] absolute bg-green-500 w-full h-1/2 bottom-0 rounded-[inherit] rounded-t-[0]"></div>
        </div>

        <span>{{box!.flagIds.length}}</span>
    </div>
    </div>
</template>