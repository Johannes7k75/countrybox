<template>
  <DefineWorldMap>
    <WorldMap
      ref="worldMapRef"
      v-if="showCountry !== 'off'"
      v-show="!isRoundOver"
      :cca2="correctOption?.cca2"
      class="my-auto !aspect-[6/4] !max-w-[37rem] p-4"
      :class="cn(!mapVisible ? 'max-largeMap:-translate-x-[100vw]' : 'max-largeMap:translate-x-0')"
      :hide="mapVisible"
    ></WorldMap>
  </DefineWorldMap>

  <div class="flex h-full max-h-full flex-col">
    <Header :lives="lives" :fails="fails" :round="isRoundOver ? round : round + 1" :maxRounds="maxRounds" />

    <div class="largeMap:grid-cols-[max-content] grid flex-grow grid-cols-[1fr_max-content_1fr] gap-4 max-sm:grid-cols-[max-content] max-sm:gap-0">
      <ReuseWorldMap v-if="isLargeMap" />

      <div class="col-start-2 flex flex-col items-center">
        <Display :displayValue="displayValue" v-show="!isRoundOver" />

        <ReuseWorldMap :class="cn(isGameOver && 'hidden')" v-if="!isLargeMap" class="grow-[10]" />

        <GameOver :is-game-over="isGameOver" :restartGame="restartGame" />
        <GameWon :is-game-won="isRoundOver" />

        <Options v-show="!isRoundOver" :showFlagOverlay="showFlagOverlay" :autoNext="autoNext" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Header from "~/components/game/Header.vue";
import Display from "~/components/game/Display.vue";
import GameOver from "~/components/game/GameOver.vue";
import Options from "~/components/game/Options.vue";
import { cn } from "~~/lib/utils";
import GameWon from "~/components/game/GameWon.vue";
// import WorldMap from "~/components/game/WorldMap.vue";

const isSmallScreen = useMediaQuery("(width < 40rem)");
const isLargeMap = useMediaQuery("(width > 1400px)");

const [DefineWorldMap, ReuseWorldMap] = createReusableTemplate();

const { isGameOver, isRoundOver, types, correctOption, events, correctGuessed, options, lives, fails, round, maxRounds } = storeToRefs(useGameStore());
const { autoNext, showCountry } = storeToRefs(useSettingsStore());
const { isGuessed, guess, isNotCorrect } = useGameStore();

// const worldMapRef = useTemplateRef(worldMapRef)

const worldMapRef = ref<{
  updateGeoJson: (cca2: string) => Promise<void>;
  isReady: boolean;
  enableInteraction: () => void;
  disableInteraction: () => void;
}>();

function showFlagOverlay(option: GameOption): boolean {
  return (isGuessed(option.cca2) && isNotCorrect(option.cca2)) || (correctGuessed.value && isNotCorrect(option.cca2))!;
}

function pressKey(key: number): void {
  if (isRoundOver.value) return;
  if (key > options.value.length) return;

  const selectedGuess = options.value[key - 1];

  if (selectedGuess && (autoNext.value ? !isGuessed(selectedGuess.cca2) : true)) {
    guess(selectedGuess.cca2);
  }
}

const displayValue = computed(() => {
  if (!correctOption.value) return "";
  switch (types.value.first) {
    case "name":
      return correctOption.value!.name;
    case "capital":
      return correctOption.value!.capital;
    case "tld":
      return correctOption.value!.tld;
    case "callCode":
      return correctOption.value!.callCode ?? "Call Code";
    case "flag":
      return correctOption.value!.cca2;
    default:
      return "Unknown Type";
  }
});

const keys = [1, 2, 3, 4];
defineShortcuts(keys.map((key) => ({ [key.toString()]: () => pressKey(key) })).reduce((p, c) => Object.assign(p, c), {}));

onMounted(() => {
  console.log(useGameStore().options.length);
  if ("redirect" in useRoute().query || (useGameStore().round == 0 && useGameStore().options.length > 0)) {
    useRouter().replace({ query: {}, path: "/game" });
  } else {
    useGameStore().startGame({
      maxFails: 3,
      maxRounds: 20,
    });
  }

  events.value
    .on("next", () => {
      if (isRoundOver.value) return;

      if (worldMapRef.value && showCountry.value === "on" && correctOption.value) {
        worldMapRef.value.updateGeoJson(correctOption.value.cca2);
      }

      if (worldMapRef.value && showCountry.value === "onAfter") {
        showMap.value = false;
        worldMapRef.value.updateGeoJson(correctOption.value!.cca2);
      }
    })
    .on("correctGuess", () => {
      if (worldMapRef.value && showCountry.value === "onAfter") {
        showMap.value = true;
      }

      $fetch("/game/round", {
        method: "POST",
        body: {
          options: options.value.map((o) => ({
            cca2: o.cca2,
            correct: o.correct,
            guessed: isGuessed(o.cca2),
          })),
        },
      });
    })
    .on("roundOver", () => {
      setTimeout(() => useRouter().push("/"), 2_000);
    })
    .on("start", () => {
      if (showCountry.value === "on" || (showCountry.value === "onAfter" && correctOption.value)) {
        worldMapRef.value?.updateGeoJson(correctOption.value!.cca2);
      }
    })
    .on("wrongGuess", () => {
      console.log("Wrong Guess", fails.value, lives.value);
      if (isGameOver.value) {
        showMap.value = true;
      }
    });

  if (showCountry.value === "on" && correctOption.value) {
    worldMapRef.value?.updateGeoJson(correctOption.value.cca2);
  }
});

const showMap = ref(false);
const mapVisible = computed(() => {
  const state = showCountry.value === "on" ? true : worldMapRef.value?.isReady ? showMap.value : false;
  if (worldMapRef.value?.isReady) {
    if (state) {
      worldMapRef.value?.enableInteraction();
    } else {
      worldMapRef.value?.disableInteraction();
    }
  }
  return state;
});

function restartGame() {
  useGameStore().startGame({
    maxFails: 3,
    maxRounds: 20,
    types: useGameStore().types,
  });

  showMap.value = false;
}
</script>
