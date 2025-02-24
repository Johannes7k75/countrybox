<script lang="ts" setup>
import { cn } from '~~/lib/utils'
import "flag-icons/css/flag-icons.min.css"
import type { GameOption } from '~/stores/game'

const { autoNext, showCountry } = storeToRefs(useSettingsStore())
const { isGameOver, isRoundOver, types, correctOption, correctGuessed, options, isGuessed, lives, fails, round, maxRounds, getIndex, isCorrect, events } = storeToRefs(useGameStore())

const worldMapRef = ref<{ updateGeoJson: (ccn3: string) => Promise<void>, isReady: boolean, enableInteraction: () => void, disableInteraction: () => void }>()

function showFlagOverlay(option: GameOption) {
  return (useGameStore().isGuessed(option.cca2) && useGameStore().isNotCorrect(option.cca2)) || (correctGuessed.value && useGameStore().isNotCorrect(option.cca2))
}

window.addEventListener("keydown", (e) => {
  const numKey = Number.parseInt(e.key)
  if ((autoNext.value && correctGuessed.value) || !numKey) return

  if (isRoundOver.value) return
  if (numKey > options.value.length) return

  const selectedGuess = options.value[numKey - 1]
  if (autoNext.value ? !isGuessed.value(selectedGuess.cca2) : true) {
    useGameStore().guess(selectedGuess.cca2)
  }
})

function reloadWindow() {
  window.location.reload()
}

const displayValue = computed(() => {
  if (!correctOption.value) return ""
  switch (types.value.first) {
    case "name": return correctOption.value!.name;
    case "capital": return correctOption.value!.capital;
    case "tld": return correctOption.value!.tld;
    case "callCode": return correctOption.value!.callCode;
    case "flag": return correctOption.value!.cca2;
    default: return "Unknown Type";
  }
})

onMounted(() => {
  if ("redirect" in useRoute().query) {
    useRouter().replace({ query: {}, path: "/game" })
    console.log(types.value)
  } else {
    useGameStore().startGame({
      maxFails: 3,
      maxRounds: 20
    })
  }

  events.value.on("next", () => {
    if (worldMapRef.value && showCountry.value === "on" && correctOption.value) {
      worldMapRef.value.updateGeoJson(correctOption.value.cca3)
    }

    if (worldMapRef.value && showCountry.value === "onAfter") {
      showMap.value = false
      worldMapRef.value!.updateGeoJson(correctOption.value!.cca3)
    }
  })
  events.value.on("correctGuess", () => {
    if (worldMapRef.value && showCountry.value === "onAfter") {
      showMap.value = true
    }
  })
  events.value.on("start", () => {
    if (showCountry.value === "on" || showCountry.value === "onAfter" && correctOption.value) {
      worldMapRef.value!.updateGeoJson(correctOption.value!.cca3)
    }
  })
  events.value.on("roundOver", () => {
    setTimeout(() => useRouter().push("/"), 2_000)

  })
  
  if (showCountry.value === "on" && correctOption.value) {
    worldMapRef.value!.updateGeoJson(correctOption.value!.cca3)
  }
})

const showMap = ref(false)
const mapVisible = computed(() => {
  const state = showCountry.value === 'on' ? true : worldMapRef.value?.isReady ? showMap.value : false
  if (worldMapRef.value?.isReady) {
    if (state) {
      worldMapRef.value?.enableInteraction()
    } else {
      worldMapRef.value?.disableInteraction()
    }
  }
  return state
})

// watch(isRoundOver, () => setTimeout(() => useRouter().push("/"), 2_000))

</script>

<template>
  <div
    class="flex flex-col items-center justify-center p-2 mx-auto w-full lg:max-w-[70rem] absolute left-1/2 transform -translate-x-1/2">
    <div class="flex flex-row w-full">
            <UButton variant="subtle" label="Home" icon="mdi:home" to="/" view-transition class="rounded-sm text-(--text)" size="xl"/>
    </div>
    <div class="flex flex-row w-full py-4">
      <div class="flex">
        <Icon v-for="n in lives" name="mdi:heart" class="text-red-600" size="2rem" />
        <Icon v-for="n in fails" name="mdi:heart-outline" size="2rem" />
      </div>
      <span class="mr-0 ml-auto">{{ round }}/{{ maxRounds }}</span>
    </div>
  </div>

  <div class="sm:w-max flex items-center flex-col mx-auto h-full pt-24">
    <div class="flex-grow content-center flex flex-col justify-center max-largeMap:p-4">
      <span :class="cn(correctGuessed && 'text-green-500 large', 'text-4xl font-bold')"
        v-show="!isGameOver && !isRoundOver">
        <template v-if="types.first === 'flag'">
          <span :class="cn('fi', `fi-${displayValue}`)"
            class="sm:!w-full sm:!h-56 !h-full rounded-md [aspect-ratio:4/3] transition-opacity duration-200"></span>
        </template>
        <template v-else>
          {{ displayValue }}
        </template>
      </span>
    </div>

    <WorldMap ref="worldMapRef" :cca3="correctOption?.cca3"
      class="largeMap:absolute largeMap:!aspect-[6/4] max-largeMap:h-full max-largeMap:flex-grow max-largeMap:!w-full z-0 max-largeMap:mb-6 largeMap:left-4 !max-w-[37rem] !w-1/4 lg:w-1/3 largeMap:top-1/2 transform largeMap:-translate-y-1/2 max-largeMap:duration-700"
      :class="cn(!mapVisible ? 'max-largeMap:-translate-x-[100vw]' : 'max-largeMap:translate-x-0')"
      v-if="showCountry !== 'off'" :hide="mapVisible" />
    <!-- showCountry === 'on' || (showCountry === 'onAfter' && correctGuessed) -->

    <span :class="cn('text-red-500 text-8xl font-bold flex-grow content-center max-sm:text-5xl')" v-show="isGameOver">
      Game over<br>
      <button @click.prevent="reloadWindow"
        class="bg-red-500 text-white flex items-center py-2 px-4 cursor-pointer rounded-2xl justify-center">
        <Icon name="mdi:reload" /> Neustarten
      </button>
    </span>

    <span :class="cn('text-green-500 text-8xl font-bold flex-grow content-center max-sm:text-5xl')"
      v-show="isRoundOver">
      Gewonnen
    </span>

    <div v-show="!isRoundOver"
      class="grid grid-cols-2 grid-rows-2 gap-8 p-4 max-sm:gap-3 max-w-full w-full bg-slate-400 rounded-md rounded-b-none ">
      <div v-for="option of options" :key="option.cca2" @click="useGameStore().guess(option.cca2)"
        class="relative cursor-pointer !w-full [aspect-ratio:4/3] rounded-md flex items-center"
        :class="cn(types.second !== 'flag' && 'bg-gray-600/70', (types.second !== 'flag' && correctGuessed) && 'bg-green-500', (showFlagOverlay(option) || isGameOver) && 'bg-gray-600/40')">

        <div class="absolute w-6 h-full content-center text-center max-sm:hidden"
          :class="cn(getIndex(option) % 2 == 0 ? '-left-10' : '-right-10')">
          <span class="h-4 bg-slate-400 w-8 p-2 rounded-md font-semibold text-gray-900/80"
            :class="cn(getIndex(option) % 2 == 0 ? 'rounded-r-none' : 'rounded-l-none')">
            {{ getIndex(option) + 1 }}
          </span>
        </div>

        <template v-if="types.second === 'flag'">
          <span
            :class="cn('fi', `fi-${option.cca2}`, ((showFlagOverlay(option) || correctGuessed) && useGameStore().isNotCorrect(option.cca2)) && 'opacity-40')"
            class="!w-full sm:!h-56  rounded-md [aspect-ratio:4/3] transition-opacity duration-200" />
          <div v-show="useGameStore().isNotCorrect(option.cca2) && (correctGuessed || isGuessed(option.cca2))"
            class="absolute right-1 top-2 p-1 rounded-md bg-gray-600/50">
            {{ option.name }}
          </div>
          <div v-show="isCorrect(option.cca2) && correctGuessed && !autoNext"
            class="absolute p-1 text-lg rounded-md bg-background-800/80 text-(--text) left-1/2 transform -translate-x-1/2">
            Press to continue
          </div>
        </template>
        <template v-else>
          <span :class="cn((showFlagOverlay(option) || isGameOver) && 'opacity-40')"
            class="transition-opacity duration-200 text-center !w-full text-2xl text-gray-950">
            {{ option[types.second] }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
