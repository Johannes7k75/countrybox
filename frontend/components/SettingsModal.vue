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
    // settings.autoNext.value = autoNext.value
    useSettingsStore().set("autoNext", autoNext.value)
}

</script>

<template>
    <UModal v-model="props.modelValue" prevent-close>
        <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                        Einstellungen
                    </h3>
                    <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
                        @click="$emit('update:modelValue', false)" />
                </div>
            </template>

            <div class="flex flex-col gap-8">
                <div class="flex flex-col gap-2">
                    <span class="font-bold">Spiel</span>
                    <div class="flex flex-col">
                        <div class="flex items-center gap-2">
                            <UToggle @change="updateAutoNext" :model-value="settings.autoNext.value" /> <span>Automatisch fortfahren</span>
                        </div>
                    </div>
                    
                </div>

                <UDivider/>
            </div>

            <!-- <template #footer>
                <Placeholder class="h-8" />
            </template> -->
        </UCard>
    </UModal>
</template>
