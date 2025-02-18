<script lang="ts" setup>
import { cn } from '~/lib/utils'
import "flag-icons/css/flag-icons.min.css"

const types = [
  "name", "capital", "tld", "callCode", "flag"
] as const

const automaticContinue = ref(true)


type Types = typeof types[number]

const [type1, type2] = ["name", "flag"] as [Types, Types]

const maxRounds = 20;
const maxFails = 3;

// Types
interface RoundEntry {
  id: number;
  name?: string;
  capital?: string;
  tld?: string;
  callCode?: string;
  cca2: string | null;
  correct: boolean;
}
type Round = RoundEntry[];

const rounds: Round[] = []

for (let i = 0; i < maxRounds; i++) {
  const roundData = await $fetch("/api/game", { method: "POST" })
  rounds.push(roundData.map((r) => ({ ...r, correct: false })))
  rounds[i][Math.floor(Math.random() * rounds[i].length)].correct = true
}

const currentRound = ref(0)
const fails = ref(0)
const correctGuessed = ref(false)
const alreadyGuessed = ref<number[]>([])

const isFinished = computed(() => currentRound.value >= maxRounds)
const failed = computed(() => fails.value >= maxFails)
const correct = computed(() => rounds.length > currentRound.value ? rounds[currentRound.value].find(r => r.correct) : undefined)

function isGuessed(countryId: number | undefined) {
  return countryId !== undefined && alreadyGuessed.value.includes(countryId)
}

function nextRound() {
  if (isFinished.value) return
  if (rounds.length > currentRound.value) currentRound.value += 1
  alreadyGuessed.value = []
  correctGuessed.value = false

  if (isFinished.value) setTimeout(() => navigateTo("/"), 1_000)
}

function guess(round: RoundEntry) {
  if (!automaticContinue.value && correctGuessed.value && round.id === correct.value?.id) {
    nextRound()
    return;
  }

  if (failed.value || correctGuessed.value || isGuessed(round.id)) return;

  alreadyGuessed.value.push(round.id)
  if (round.correct) {
    correctGuessed.value = true
    if (automaticContinue.value) {
      setTimeout(() => nextRound(), 1_000)
    }
  } else {
    fails.value++
  }
}

function showFlagOverlay(round: RoundEntry) {
  return (isGuessed(round.id) && round.id !== correct.value?.id) || (correctGuessed.value && correct.value?.id !== round.id)
}

window.addEventListener("keydown", (e) => {
  const numKey = Number.parseInt(e.key)
  if (correctGuessed.value || !numKey) return

  if (rounds.length <= currentRound.value) return
  const round = rounds[currentRound.value]
  if (numKey > round.length) return

  const selectedGuess = round[numKey - 1]
  if (!isGuessed(selectedGuess.id)) guess(selectedGuess)
})

function reloadWindow() {
  window.location.reload()
}

const displayValue = computed(() => {
  if (!correct.value) return ""
  switch (type1) {
    case "name": return correct.value.name;
    case "capital": return correct.value.capital;
    case "tld": return correct.value.tld;
    case "callCode": return correct.value.callCode;
    case "flag": return correct.value.cca2;
    default: return "Unknown Type";
  }
})

</script>

<template>
  <div
    class="flex flex-col items-center justify-center p-2 mx-auto w-full lg:max-w-[70rem] absolute left-1/2 transform -translate-x-1/2">
    <div class="flex flex-row w-full">
      <NuxtLink to="/"
        class="flex flex-row border border-solid border-gray-400 w-max pl-1 px-2 py-1 ml-0 mr-auto hover:bg-gray-500/20 cursor-pointer">
        <Icon name="mdi:home" size="24px" />Home
      </NuxtLink>
      <div class="ml-auto mr-0">
        <input type="checkbox" v-model="automaticContinue"> Automatisch fortfahren
      </div>
    </div>
    <div class="flex flex-row w-full py-4">
      <div class="flex">
        <Icon v-for="n in maxFails - fails" name="mdi:heart" class="text-red-600" size="2rem" />
        <Icon v-for="n in fails" name="mdi:heart-outline" size="2rem" />
      </div>
      <span class="mr-0 ml-auto">{{ currentRound }}/{{ maxRounds }}</span>
    </div>
  </div>

  <div class="lg:w-max flex items-center flex-col mx-auto h-full">
    <div class="flex-grow content-center flex flex-col justify-center">
      <span :class="cn(isGuessed(correct?.id) && 'text-green-500 large', 'text-4xl font-bold  ')"
        v-show="!failed && !isFinished">
        <template v-if="type1 === 'flag'">
          <span :class="cn('fi', `fi-${displayValue}`)"
            class="!w-full sm:!w-max sm:!h-56 !h-full rounded-md [aspect-ratio:4/3] transition-opacity duration-200"></span>
        </template>
        <template v-else>
          {{ displayValue }}
        </template>
      </span>
    </div>

    <span :class="cn('text-red-500 text-8xl font-bold flex-grow content-center max-sm:text-5xl')" v-show="failed">
      Game over<br>
      <button @click.prevent="reloadWindow"
        class="bg-red-500 text-white flex items-center py-2 px-4 cursor-pointer rounded-2xl justify-center">
        <Icon name="mdi:reload" /> Neustarten
      </button>
    </span>

    <span :class="cn('text-green-500 text-8xl font-bold flex-grow content-center max-sm:text-5xl')" v-show="isFinished">
      Gewonnen
    </span>

    <div v-show="!isFinished"
      class="grid grid-cols-2 grid-rows-2 gap-8 p-4 max-sm:gap-3 max-w-full w-full sm:w-max bg-slate-400 rounded-md rounded-b-none max-sm:mb-0">
      <div v-for="round of rounds[currentRound]" :key="round.id" @click="guess(round)"
        class="relative cursor-pointer !w-full [aspect-ratio:4/3] rounded-md flex items-center"
        :class="cn(type2 !== 'flag' && 'bg-gray-600/70', (type2 !== 'flag' && correctGuessed) && 'bg-green-500', ((showFlagOverlay(round) || failed)) && 'bg-gray-600/40')">

        <div class="absolute w-6 h-full content-center text-center max-sm:hidden"
          :class="cn(rounds[currentRound].indexOf(round) % 2 == 0 ? '-left-10' : '-right-10')">
          <span class="h-4 bg-slate-400 w-8 p-2 rounded-md font-semibold text-gray-900/80"
            :class="cn(rounds[currentRound].indexOf(round) % 2 == 0 ? 'rounded-r-none' : 'rounded-l-none')">
            {{ rounds[currentRound].indexOf(round) + 1 }}
          </span>
        </div>

        <template v-if="type2 === 'flag'">
          <span :class="cn('fi', `fi-${round.cca2}`, ((showFlagOverlay(round) || correctGuessed) && correct?.id != round.id) && 'opacity-40')"
            class="!w-full sm:!h-56  rounded-md [aspect-ratio:4/3] transition-opacity duration-200" />
          <div v-show="round.id !== correct!.id && correctGuessed"
            class="absolute right-1 top-2 p-1 rounded-md bg-gray-600/50">
            {{ round.name }}
          </div>
          <div v-show="round.id === correct!.id && correctGuessed && !automaticContinue"
            class="absolute p-1 text-lg rounded-md bg-gray-600/50 left-1/2 transform -translate-x-1/2">
            Press to continue
          </div>
        </template>
        <template v-else>
          <span :class="cn((showFlagOverlay(round) || failed) && 'opacity-40')"
            class="transition-opacity duration-200 text-center !w-full text-2xl text-gray-950">
            {{ round[type2] }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
