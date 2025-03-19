<script lang="ts" setup>
import { UButton, UIcon } from "#components";
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

const placeholder = await $fetch(`/api/v2/flags/de`);
const tld = await $fetch(`/api/v2/tlds/de`);

function createEditableNode(label: string, ops?: {parentClass?: string, labelClass?: string, editClass?: string}) {
  return h("div", { className: `relative leading-4 ${ops?.parentClass}` }, [
    h("span", {className: ops?.labelClass}, label),
    h(UButton, { icon: "mdi:pencil", class: "absolute right-0 top-0 m-1 ".concat(ops?.editClass??""), size: "sm", onClick: ()=>console.log(1) }),
  ]);
}

function displayNode(type: GameTypes) {
  if (!placeholder) return h("span", {}, "Unknown Type");

  switch (type) {
    case "name":
      return createEditableNode(placeholder.name);
    case "capital":
      return createEditableNode(placeholder.capital);
    case "tld":
      return createEditableNode(tld?.[0]?.tld ?? "");
    case "callCode":
      return createEditableNode(`+${placeholder.callingCode}`);
    case "flag":
      return createEditableNode("",{parentClass: "w-1/2 mx-auto", labelClass: `fi fi-${placeholder.cca2} !w-full !aspect-[4/3]`})
      // h("div", { className: "relative w-1/2 mx-auto" }, [
      //   h("span", { className: `fi fi-${placeholder.cca2} !w-full !aspect-[4/3]` }),
      //   h(UButton, { icon: "mdi:pencil", class: "absolute right-0 top-0 m-1 mt-2", size: "sm" }),
      // ]);
    default:
      return h("span", {}, "Unknown Type");
  }
}

const firstDiplayNode = computed(() => displayNode(firstType.value));
const secondDiplayNode = computed(() => displayNode(secondType.value));

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
  <div class="mx-auto w-max p-4">
    <!-- <GameTypeSelector
      :selectedType="firstType"
      :disabledType="secondType"
      :updateType="updateFirstType"
    /> -->

    <div class="relative my-4 flex h-[600px] w-[400px] flex-col rounded-sm border-[1px] border-solid border-white/30 bg-slate-900">
      <!-- <GameCountryFilters class="w-max float-right m-2 absolute right-0" /> -->
      <div class="h-full w-full flex-grow content-center text-center">
        <!-- <firstDiplayNode  /> -->
         <GameSelectorEditable :type="firstType" :secondType="secondType" :update="(t)=>firstType = t"/>
      </div>

      <div class="mt-auto mb-0 grid w-full grid-cols-2 grid-rows-2 gap-2 p-2">
        <!-- <secondDiplayNode v-for="n in 4" class="relative !aspect-[4/3] w-full content-center rounded-md bg-gray-500 text-center" /> -->
        <GameSelectorEditable :type="secondType" :secondType="firstType" :update="(t)=>secondType = t" v-for="n in 4" class="relative !aspect-[4/3] w-full content-center rounded-md bg-gray-500 text-center" />
      </div>
    </div>

    <!-- <GameTypeSelector
      :selectedType="secondType"
      :disabledType="firstType"
      :updateType="updateSecondType"
    /> -->

    <div class="mt-8 w-full px-2">
      <UButton label="Start" class="w-full justify-center p-4 text-2xl font-bold" @click="startGame" />
    </div>
  </div>
</template>
