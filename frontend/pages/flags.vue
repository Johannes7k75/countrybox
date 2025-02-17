<script setup lang="ts">
import "flag-icons/css/flag-icons.min.css"
import { cn } from "~/lib/utils"

const mapping = {
    name: "name",
    capital: "capital",
    code: "cca3",
    cca2: "cca2",
    countryId: "id",
    callCode: "callingCode"
}

const flagCodes = await $fetch<typeof mapping[]>("/api/flags", {
    method: "POST",
    body: {
        mapping
    }
})

console.log(flagCodes)

const flags = computed(() => flagCodes
    .map(({ code, name, capital, cca2, countryId, callCode }) => ({ countryId,callCode, code, cca2, name, capital, path: `/flags/${code}.svg` }))
    .filter(flag => query.value != "" ? flag.capital.toLowerCase().includes(query.value.toLowerCase()) || flag.name.toLowerCase().includes(query.value.toLowerCase()) : true)
)

const flagMap = computed(() => {
    const map = new Map();
    flagCodes
        .filter(({ capital, name }) => query.value != "" ? capital.toLowerCase().includes(query.value.toLowerCase()) || name.toLowerCase().includes(query.value.toLowerCase()) : true)
        .forEach(({ code, countryId }) => map.set(countryId, code))

    return map;
})

const isFlipped = ref<string>()
const query = ref("")

console.log(flagMap.value)

const tldMap = new Map<string, string>()
onMounted(async () => {
    const tlds = await $fetch("/api/flags/tlds", {
        method: "POST",
        body: {
            countries: flags.value.map(flag => flag.code)
        }
    })

    tlds.forEach(tld => {
        console.log(tldMap.values().filter(x=>x==tld.tld))
        tldMap.set(flagMap.value.get(tld.countryId), tld.tld)
    })

    console.log(tldMap)
})


</script>

<template>

    <div class="max-h-full overflow-y-scroll w-full pb-16 mt-0 mb-auto">
        <NuxtLink to="/"
            class="flex flex-row mt-4 ml-4 border border-solid border-gray-400 w-max pl-1 px-2 py-1 hover:bg-gray-200">
            <Icon name="mdi:home" size="24px" />Home
        </NuxtLink>

        <div class="flex items-center flex-col">
            <div class="w-max flex flex-col">
                <div class="w-full flex justify-between">
                    <label for="search">Land oder Stadt</label>
                    <span class="text-black/50">({{ flags.length }})</span>
                </div>
                <input type="text" name="search" placeholder="Deutschland"
                    class="mb-8 border-solid border-gray-400 border-[2px] rounded-sm after:content-['Test'] "
                    v-model="query" />
            </div>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 mx-auto w-max">
                <div v-for="flag in flags" :key="flag.code"
                    class="[perspective:1000px] inline-block w-[240px] [aspect-ratio:4/3] cursor-pointer"
                    @click="isFlipped === flag.code ? isFlipped = undefined : isFlipped = flag.code">

                    <div class="group w-full h-full relative [transform-style:preserve-3d]">
                        <!-- Front -->
                        <div class="card-face bg-white transition-transform duration-[700ms]"
                            :class="isFlipped === flag.code && '[transform:rotateX(180deg)]'">
                            <!-- <img :src="flag.path" class="w-full h-full rounded-2xl object-cover" /> -->

                            <span :class="cn('!w-full h-full rounded-md fi', `fi-${flag.cca2}`)"></span>

                        </div>

                        <!-- Back -->
                        <div class="card-face bg-[#1a202c] text-white text-center transition-transform duration-[700ms] [transform:rotateX(180deg)] relative"
                            :class="isFlipped === flag.code && '[transform:rotateX(360deg)]'">
                            <div class="w-full h-full flex items-center [font-size:16px] relative">
                                <!-- <img :src="flag.path"
                                class="w-10 h-[30px] object-contain absolute top-2 left-2 border border-solid border-white rounded-sm" /> -->
                                <span
                                    :class="cn('!w-10 [aspect-ratio:4/3] !absolute top-2 left-2 border border-solid border-white rounded-sm fi', `fi-${flag.cca2}`)"></span>

                                <span
                                    :class="cn('!absolute bottom-2 left-2 rounded-md bg-white/25 px-2 py-1 text-white/80')">
                                    {{ tldMap.get(flag.code) }}
                                </span>

                                <span
                                    :class="cn('!absolute bottom-2 right-2 rounded-md bg-white/25 px-2 py-1 text-white/80')"
                                    v-show="flag.callCode && flag.callCode!=''"
                                    >
                                    +{{ flag.callCode }}
                                </span>

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