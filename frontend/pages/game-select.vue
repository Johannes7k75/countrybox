<script lang="ts" setup>
import "flag-icons/css/flag-icons.min.css"
import { ref } from 'vue';

definePageMeta({
    layout: "centered"
})

const firstType = ref<GameTypes>('name');
const secondType = ref<GameTypes>('flag');

const updateFirstType = (type: GameTypes) => {
    firstType.value = type;
};

const updateSecondType = (type: GameTypes) => {
    secondType.value = type;
};

const placeholder = await $fetch(`/api/flags/de`)
const tld = await $fetch(`/api/data/tld/de`)

function dieplayNode(type: GameTypes, first?: true) {
    switch (type) {
        case "name": return h("span", {}, placeholder.name)
        case "capital": return h("span", {}, placeholder.capital)
        case "tld": return h("span", {}, tld[0].tld)
        case "callCode": return h("span", {}, `+${placeholder.callingCode}`)
        case "flag": return h("span", {class: `fi fi-${placeholder.cca2} !w-full h-full ${first && "!max-w-[50%]"}`})

        default: return h("span", {}, "Unknown Type")
    }
}

const firstDiplayNode= computed(()=>dieplayNode(firstType.value, true))
const secondDiplayNode= computed(()=>dieplayNode(secondType.value))

function startGame() {
    
}
</script>

<template>
    <div class="w-max mx-auto">
        <GameTypeSelector :selectedType="firstType" :disabledType="secondType" :updateType="updateFirstType" />
        <GameTypeSelector :selectedType="secondType" :disabledType="firstType" :updateType="updateSecondType" />

        <div class="w-[400px] h-[600px] rounded-md bg-slate-900 flex flex-col mt-4">
            <div class="w-full flex-grow content-center text-center">
                <firstDiplayNode />
            </div>

            <div class="grid grid-cols-2 grid-rows-2 w-full p-2 gap-2 mb-0 mt-auto">
                <secondDiplayNode v-for="n in 4" class="w-full !aspect-[4/3] content-center text-center rounded-md bg-gray-500" />
            </div>
        </div>

        <div class="w-full px-2 mt-8">
            <UButton label="Start" class="p-4 text-2xl font-bold justify-center w-full" @click="startGame" />
        </div>
    </div>
</template>
