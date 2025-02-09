<script setup lang="ts">

const mapping = {
    name: "name",
    capital: "capital",
    code: "cca3"
}

const flagCodes = await $fetch<typeof mapping[]>("/api/flags", {
    method: "POST",
    body: {
        mapping
    }
})

const flags = computed(() => flagCodes.map(({ code, name, capital }) => ({ code, name, capital, path: `/flags/${code}.svg` })))

const isFlipped = ref<string>()

</script>

<template>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 mx-auto w-max">
        <div v-for="flag in flags" :key="flag.code"
            class="[perspective:1000px] inline-block w-[240px] h-[160px] cursor-pointer"
            @click="isFlipped === flag.code ? isFlipped = undefined : isFlipped = flag.code">

            <div class="group w-full h-full relative [transform-style:preserve-3d]">
                <!-- Front -->
                <div class="card-face bg-white transition-transform duration-[700ms]"
                    :class="isFlipped === flag.code && '[transform:rotateX(180deg)]'">
                    <img :src="flag.path" class="w-full h-full rounded-2xl object-cover" />
                </div>

                <!-- Back -->
                <div class="card-face bg-[#1a202c] text-white text-center transition-transform duration-[700ms] [transform:rotateX(180deg)] relative"
                    :class="isFlipped === flag.code && '[transform:rotateX(360deg)]'">
                    <div class="w-full h-full flex items-center [font-size:16px] relative">
                        <img :src="flag.path"
                            class="w-10 h-[30px] object-contain absolute top-2 left-2 border border-solid border-white rounded-sm" />
                        <div class="mx-auto my-auto">
                            <h3>{{ flag.name }}</h3>
                            <p>{{ flag.capital }}</p>
                        </div>
                    </div>


                </div>
            </div>

            <!-- <img :src="path" /> -->
        </div>
    </div>

</template>

<style>
.card-face {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
</style>