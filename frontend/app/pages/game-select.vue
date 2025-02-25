<script lang="ts" setup>
import "flag-icons/css/flag-icons.min.css";

definePageMeta({
  layout: "centered",
});

const firstType = ref<GameTypes>("name");
const secondType = ref<GameTypes>("flag");

const updateFirstType = (type: GameTypes) => {
  firstType.value = type;
};

const updateSecondType = (type: GameTypes) => {
  secondType.value = type;
};

const placeholder = await $fetch(`/api/flags/de`);
const tld = await $fetch(`/api/data/tld/de`);

function dieplayNode(type: GameTypes, first?: true) {
  switch (type) {
    case "name":
      return h("span", {}, placeholder.name);
    case "capital":
      return h("span", {}, placeholder.capital);
    case "tld":
      return h("span", {}, tld[0].tld);
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

const firstDiplayNode = computed(() => dieplayNode(firstType.value, true));
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

  navigateTo("/game?redirect");
}
</script>

<template>
  <div class="mx-auto w-max">
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

    <div class="mt-4 flex h-[600px] w-[400px] flex-col rounded-md bg-slate-900">
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
