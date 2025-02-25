<script lang="ts" setup>
import { cn } from "~~/lib/utils";
import "flag-icons/css/flag-icons.min.css";
import type { GameOption } from "~/stores/game";

const { autoNext, showCountry } = storeToRefs(useSettingsStore());
const {
  isGameOver,
  isRoundOver,
  types,
  correctOption,
  correctGuessed,
  options,
  isGuessed,
  lives,
  fails,
  round,
  maxRounds,
  getIndex,
  isCorrect,
  events,
} = storeToRefs(useGameStore());

const worldMapRef = ref<{
  updateGeoJson: (ccn3: string) => Promise<void>;
  isReady: boolean;
  enableInteraction: () => void;
  disableInteraction: () => void;
}>();

function showFlagOverlay(option: GameOption) {
  return (
    (useGameStore().isGuessed(option.cca2) &&
      useGameStore().isNotCorrect(option.cca2)) ||
    (correctGuessed.value && useGameStore().isNotCorrect(option.cca2))
  );
}

window.addEventListener("keydown", (e) => {
  const numKey = Number.parseInt(e.key);
  if ((autoNext.value && correctGuessed.value) || !numKey) return;

  if (isRoundOver.value) return;
  if (numKey > options.value.length) return;

  const selectedGuess = options.value[numKey - 1];
  if (autoNext.value ? !isGuessed.value(selectedGuess.cca2) : true) {
    useGameStore().guess(selectedGuess.cca2);
  }
});

function reloadWindow() {
  window.location.reload();
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
      return correctOption.value!.callCode;
    case "flag":
      return correctOption.value!.cca2;
    default:
      return "Unknown Type";
  }
});

onMounted(() => {
  if ("redirect" in useRoute().query) {
    useRouter().replace({ query: {}, path: "/game" });
    console.log(types.value);
  } else {
    useGameStore().startGame({
      maxFails: 3,
      maxRounds: 20,
    });
  }

  events.value.on("next", () => {
    if (
      worldMapRef.value &&
      showCountry.value === "on" &&
      correctOption.value
    ) {
      worldMapRef.value.updateGeoJson(correctOption.value.cca3);
    }

    if (worldMapRef.value && showCountry.value === "onAfter") {
      showMap.value = false;
      worldMapRef.value!.updateGeoJson(correctOption.value!.cca3);
    }
  });
  events.value.on("correctGuess", () => {
    if (worldMapRef.value && showCountry.value === "onAfter") {
      showMap.value = true;
    }
  });
  events.value.on("start", () => {
    if (
      showCountry.value === "on" ||
      (showCountry.value === "onAfter" && correctOption.value)
    ) {
      worldMapRef.value!.updateGeoJson(correctOption.value!.cca3);
    }
  });
  events.value.on("roundOver", () => {
    setTimeout(() => useRouter().push("/"), 2_000);
  });

  if (showCountry.value === "on" && correctOption.value) {
    worldMapRef.value!.updateGeoJson(correctOption.value!.cca3);
  }
});

const showMap = ref(false);
const mapVisible = computed(() => {
  const state =
    showCountry.value === "on"
      ? true
      : worldMapRef.value?.isReady
        ? showMap.value
        : false;
  if (worldMapRef.value?.isReady) {
    if (state) {
      worldMapRef.value?.enableInteraction();
    } else {
      worldMapRef.value?.disableInteraction();
    }
  }
  return state;
});

// watch(isRoundOver, () => setTimeout(() => useRouter().push("/"), 2_000))
</script>

<template>
  <div
    class="absolute left-1/2 mx-auto flex w-full -translate-x-1/2 transform flex-col items-center justify-center p-2 lg:max-w-[70rem]"
  >
    <div class="flex w-full flex-row">
      <UButton
        variant="subtle"
        label="Home"
        icon="mdi:home"
        to="/"
        view-transition
        class="rounded-sm text-(--text)"
        size="xl"
      />
    </div>
    <div class="flex w-full flex-row py-4">
      <div class="flex">
        <Icon
          v-for="n in lives"
          name="mdi:heart"
          class="text-red-600"
          size="2rem"
        />
        <Icon v-for="n in fails" name="mdi:heart-outline" size="2rem" />
      </div>
      <span class="mr-0 ml-auto">{{ round }}/{{ maxRounds }}</span>
    </div>
  </div>

  <div class="mx-auto flex h-full flex-col items-center pt-24 sm:w-max">
    <div
      class="max-largeMap:p-4 flex flex-grow flex-col content-center justify-center"
    >
      <span
        :class="
          cn(correctGuessed && 'large text-green-500', 'text-4xl font-bold')
        "
        v-show="!isGameOver && !isRoundOver"
      >
        <template v-if="types.first === 'flag'">
          <span
            :class="cn('fi', `fi-${displayValue}`)"
            class="[aspect-ratio:4/3] !h-full rounded-md transition-opacity duration-200 sm:!h-56 sm:!w-full"
          ></span>
        </template>
        <template v-else>
          {{ displayValue }}
        </template>
      </span>
    </div>

    <WorldMap
      ref="worldMapRef"
      :cca3="correctOption?.cca3"
      class="largeMap:absolute largeMap:!aspect-[6/4] max-largeMap:h-full max-largeMap:flex-grow max-largeMap:!w-full max-largeMap:mb-6 largeMap:left-4 largeMap:top-1/2 largeMap:-translate-y-1/2 max-largeMap:duration-700 z-0 !w-1/4 !max-w-[37rem] transform lg:w-1/3"
      :class="
        cn(
          !mapVisible
            ? 'max-largeMap:-translate-x-[100vw]'
            : 'max-largeMap:translate-x-0',
        )
      "
      v-if="showCountry !== 'off'"
      :hide="mapVisible"
    />
    <!-- showCountry === 'on' || (showCountry === 'onAfter' && correctGuessed) -->

    <span
      :class="
        cn(
          'flex-grow content-center text-8xl font-bold text-red-500 max-sm:text-5xl',
        )
      "
      v-show="isGameOver"
    >
      Game over<br />
      <button
        @click.prevent="reloadWindow"
        class="flex cursor-pointer items-center justify-center rounded-2xl bg-red-500 px-4 py-2 text-white"
      >
        <Icon name="mdi:reload" /> Neustarten
      </button>
    </span>

    <span
      :class="
        cn(
          'flex-grow content-center text-8xl font-bold text-green-500 max-sm:text-5xl',
        )
      "
      v-show="isRoundOver"
    >
      Gewonnen
    </span>

    <div
      v-show="!isRoundOver"
      class="grid w-full max-w-full grid-cols-2 grid-rows-2 gap-8 rounded-md rounded-b-none bg-slate-400 p-4 max-sm:gap-3"
    >
      <div
        v-for="option of options"
        :key="option.cca2"
        @click="useGameStore().guess(option.cca2)"
        class="relative flex [aspect-ratio:4/3] !w-full cursor-pointer items-center rounded-md"
        :class="
          cn(
            types.second !== 'flag' && 'bg-gray-600/70',
            types.second !== 'flag' && correctGuessed && 'bg-green-500',
            (showFlagOverlay(option) || isGameOver) && 'bg-gray-600/40',
          )
        "
      >
        <div
          class="absolute h-full w-6 content-center text-center max-sm:hidden"
          :class="cn(getIndex(option) % 2 == 0 ? '-left-10' : '-right-10')"
        >
          <span
            class="h-4 w-8 rounded-md bg-slate-400 p-2 font-semibold text-gray-900/80"
            :class="
              cn(
                getIndex(option) % 2 == 0 ? 'rounded-r-none' : 'rounded-l-none',
              )
            "
          >
            {{ getIndex(option) + 1 }}
          </span>
        </div>

        <template v-if="types.second === 'flag'">
          <span
            :class="
              cn(
                'fi',
                `fi-${option.cca2}`,
                (showFlagOverlay(option) || correctGuessed) &&
                  useGameStore().isNotCorrect(option.cca2) &&
                  'opacity-40',
              )
            "
            class="[aspect-ratio:4/3] !w-full rounded-md transition-opacity duration-200 sm:!h-56"
          />
          <div
            v-show="
              useGameStore().isNotCorrect(option.cca2) &&
              (correctGuessed || isGuessed(option.cca2))
            "
            class="absolute top-2 right-1 rounded-md bg-gray-600/50 p-1"
          >
            {{ option.name }}
          </div>
          <div
            v-show="isCorrect(option.cca2) && correctGuessed && !autoNext"
            class="bg-background-800/80 absolute left-1/2 -translate-x-1/2 transform rounded-md p-1 text-lg text-(--text)"
          >
            Press to continue
          </div>
        </template>
        <template v-else>
          <span
            :class="cn((showFlagOverlay(option) || isGameOver) && 'opacity-40')"
            class="!w-full text-center text-2xl text-gray-950 transition-opacity duration-200"
          >
            {{ option[types.second] }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
