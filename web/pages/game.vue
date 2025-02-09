<script lang="ts" setup>
import { cn } from '~/lib/utils'


const maxRounds = 20

type Round = (typeof tables.Countries.$inferSelect & { correct: boolean })[]

const rounds: Round[] = []

for (let i = 0; i < maxRounds; i++) {
    const round = await $fetch("/api/game", { method: "POST" })

    rounds.push(round.map((r) => ({ ...r, correct: false })))

    rounds[i][Math.floor(Math.random() * rounds[i].length)].correct = true
}

const currentRound = ref(0)
const fails = ref(0)

const isFinished = computed(() => currentRound.value + 1 >= maxRounds)
const failed = computed(() => fails.value >= 3)
const correct = computed(() => rounds[currentRound.value].find((r) => r.correct))

const correctGuessed = ref(false)
const alreadyGuessed = ref<number[]>([])
function isGuessed(countryId: number) {
    return !!alreadyGuessed.value.find(g => g === countryId)
}

function nextRound() {
    if (isFinished.value) return
    if (rounds.length > currentRound.value+1) currentRound.value += 1
    alreadyGuessed.value = []
    correctGuessed.value = false
}

function guess(round: Round[number]) {
    alreadyGuessed.value.push(round.id)

    if (round.correct) {
        correctGuessed.value = true
        setTimeout(() => nextRound(), 2_000)
    } else {
        fails.value++
    }

}

function showFlagOverlay(round: Round[number]) {
    return (isGuessed(round.id) && round.id !== correct.value!.id) || (correctGuessed.value && correct.value!.id !== round.id)
}

window.addEventListener("keydown", (e) => {
    const numKey = Number.parseInt(e.key)
    if (correctGuessed.value || !numKey) return

    if (rounds.length < currentRound.value) return
    const round = rounds[currentRound.value]
    if (numKey > round.length) return

    const selectedGuess = round[numKey - 1]
    if (!isGuessed(selectedGuess.id)) guess(selectedGuess)
})

</script>

<template>

    <button :disabled="isFinished" @click="!isFinished && currentRound++" class="bg-gray-600 rounded-md p-2 m-8">
        +1
    </button>

    {{ isFinished }} {{ currentRound + 1 }}

    {{ failed }} {{ fails }}

    <div class="w-full h-full flex items-center flex-col">
        <span :class="isGuessed(correct!.id) && 'text-green-500'">{{ correct?.name }}</span>

        <div class="grid grid-cols-2 grid-rows-2 w-max gap-4">
            <div v-for="round of rounds[currentRound]" :key="round.id">
                <div @click="guess(round)" class="relative inline-block bg-white">

                    <img :src="`/flags/${round.cca3}.svg`" class="w-48 h-24 object-cover"
                        :class="cn(showFlagOverlay(round) && 'opacity-20')">

                    <div v-show="isGuessed(round.id) && round.id !== correct!.id && !correctGuessed"
                        class="absolute right-0 top-0">
                        {{ round.name }}
                    </div>


                </div>
            </div>
        </div>
    </div>


</template>