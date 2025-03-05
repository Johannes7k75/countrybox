<script lang="ts" setup>
import "flag-icons/css/flag-icons.min.css";

const { selectedGame } = storeToRefs(useSettingsStore());

const firstType = computed({
  get() {
    return selectedGame.value[0];
  },
  set(val: GameTypes) {
    selectedGame.value[0] = val;
  },
});
const secondType = computed({
  get() {
    return selectedGame.value[1];
  },
  set(val: GameTypes) {
    selectedGame.value[1] = val;
  },
});

const updateFirstType = (type: GameTypes) => {
  firstType.value = type;

  useSettingsStore().set("selectedGame", selectedGame.value);
};

const updateSecondType = (type: GameTypes) => {
  secondType.value = type;

  useSettingsStore().set("selectedGame", selectedGame.value);
};

const placeholder = await $fetch(`/api/flags/de`);
const tld = await $fetch(`/api/data/tld/de`);

function dieplayNode(type: GameTypes, first?: true) {
  if (!placeholder) {
    return h("span", {}, "Unknown Type");
  }

  switch (type) {
    case "name":
      return h("span", {}, placeholder.name);
    case "capital":
      return h("span", {}, placeholder.capital);
    case "tld":
      return h("span", {}, tld[0]?.tld ?? "");
    case "callCode":
      return h("span", {}, `+${placeholder.callingCode}`);
    case "flag":
      return h("span", {
        class: `fi fi-${placeholder.cca2} !w-full h-full ${first && "!max-w-[50%]"}`,
      });

    default:
      return h("span", {}, "Unknown Type");
  }
}

const firstDiplayNode = computed(() =>
  dieplayNode(firstType.value, true),
);
const secondDiplayNode = computed(() => dieplayNode(secondType.value));

function startGame() {
  useGameStore().startGame({
    maxFails: 3,
    maxRounds: 20,
    types: {
      first: firstType.value,
      second: secondType.value,
    },
  });

  useRouter().push({
    path: "game",
  });
}
</script>

<template>
  <GameCountryFilters />

  <div class="mx-auto w-max p-4">
    <GameTypeSelector
      :selectedType="firstType"
      :disabledType="secondType"
      :updateType="updateFirstType"
    />
    <GameTypeSelector
      :selectedType="secondType"
      :disabledType="firstType"
      :updateType="updateSecondType"
    />

    <div
      class="mt-4 flex h-[600px] w-[400px] flex-col rounded-sm border-[1px] border-solid border-white/30 bg-slate-900"
    >
      <div class="w-full flex-grow content-center text-center">
        <firstDiplayNode />
      </div>

      <div class="mt-auto mb-0 grid w-full grid-cols-2 grid-rows-2 gap-2 p-2">
        <secondDiplayNode
          v-for="n in 4"
          class="!aspect-[4/3] w-full content-center rounded-md bg-gray-500 text-center"
        />
      </div>
    </div>

    <div class="mt-8 w-full px-2">
      <UButton
        label="Start"
        class="w-full justify-center p-4 text-2xl font-bold"
        @click="startGame"
      />
    </div>
  </div>
</template>
