<script lang="ts" setup>
interface SettingsModalProps {
    modelValue: boolean;
}

const props = defineProps<SettingsModalProps>();
const emit = defineEmits(["update:modelValue"]);

defineShortcuts({
    escape: {
        usingInput: true,
        whenever: [() => props.modelValue],
        handler: () => {
            emit("update:modelValue", false)
        }
    }
})

const settings = storeToRefs(useSettingsStore())

const autoNext = ref(settings.autoNext.value)
function updateAutoNext() {
    autoNext.value = !autoNext.value
    useSettingsStore().set("autoNext", autoNext.value)
}



// const mapState = ref<"on" | "off" | "onAfter">(useSettingsStore().showCountry)
// watch(mapState, () => useSettingsStore().set("showCountry", mapState.value))

const mapStates = ["off","on","onAfter"] as const
const selectedMapState = computed({
    get() {
        return mapStates.indexOf(useSettingsStore().showCountry)
    },
    set(value:number) {
        useSettingsStore().set("showCountry", mapStates[value])
    }
})

</script>

<template>
    <UModal v-model="props.modelValue" prevent-close>
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                        {{ $t("settings.head.settings") }}
                    </h3>
                    <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
                        @click="$emit('update:modelValue', false)" />
                </div>
            </template>

            <div class="flex flex-col gap-8">
                <div class="flex flex-col gap-2">
                    <span class="font-bold">{{ $t("settings.categories.game.name") }}</span>
                    <div class="flex flex-col">
                        <div class="flex items-center gap-2">
                            <UToggle @change="updateAutoNext" :model-value="settings.autoNext.value" />
                            <span>{{ $t("settings.categories.game.autoNext") }}</span>
                        </div>
                    </div>

                    <div class="flex flex-col">
                        <!-- <URadio v-for="state of mapStates" :key="state.value" v-model="mapState" v-bind="state" class="pl-4"/>  -->

                        <!-- <URadioGroup :options="[{ value: 'off' }, { value: 'on' }, { value: 'onAfter' }]" v-model="mapState">
                            <template #legend>
                                {{ $t("settings.categories.game.showMap.legend") }}
                            </template>

                            <template #label="{ option }">
                                {{ $t(`settings.categories.game.showMap.${option.value}`) }}
                            </template>
                        </URadioGroup> -->

                        <span>{{ $t("settings.categories.game.showMap.legend") }}</span>
                        <UTabs :items="mapStates.map(s=>({label:s}))" :ui="{list:{marker: {background: 'bg-red-500'},tab:{active: 'bg-primary !text-black'}}}" v-model="selectedMapState">
                            <template #default="{item}">
                                <span >{{ $t(`settings.categories.game.showMap.${item.label}`) }}</span>
                            </template>
                        </UTabs>
                    </div>


                </div>

                <UDivider />
            </div>

            <!-- <template #footer>
                <Placeholder class="h-8" />
            </template> -->
        </UCard>
    </UModal>
</template>
