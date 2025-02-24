<script lang="ts" setup>
import { object, string, z } from 'zod'
import type { FormError, FormErrorEvent, FormSubmitEvent } from '@nuxt/ui'

defineProps({
    loading: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        required: true
    },
    repeatPassword: {
        type: Boolean,
        default: false
    }
})
const emit = defineEmits(["onSubmit"])

const schema = object({
    email: string().email("Invalid email"),
    password: string().min(8, "Must be at least 8 characters"),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    email: undefined,
    password: undefined,
})

const passwordRepeat = ref<string>()

async function onSubmit(event: FormSubmitEvent<Schema>) {
    console.log("Form Submitted!", event.data)
    emit("onSubmit", schema.parse(event.data))
}

async function onError(event: FormErrorEvent) {
    if (event?.errors?.[0]?.id) {
    const element = document.getElementById(event.errors[0].id)
    element?.focus()
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function validate(state: any): FormError[] {
    const errors: FormError[] = []
    if (!state.email) errors.push({ name: 'email', message: 'Required' })
    if (!state.password) errors.push({ name: 'password', message: 'Required' })
    if (state.password !== passwordRepeat.value) errors.push({ name: "passwordRepeat", message: "Müssen gleich sein" })
    return errors
}
</script>

<template>
    <h1 class="w-full text-center">{{ title }}</h1>
    <UForm :validate="validate" :schema="schema" :state="state" @submit="onSubmit" @error="onError">
        <UFormField :label="$t('auth.email')" name="email" required>
            <UInput v-model="state.email" class="w-full"/>
        </UFormField>

        <UFormField :label="$t('auth.password')" name="password" required>
            <UInput v-model="state.password" type="password" class="w-full"/>
        </UFormField>

        <UFormField :label="$t('auth.passwordRepeat')" name="passwordRepeat" required v-if="repeatPassword" class="w-full">
            <UInput v-model="passwordRepeat" type="password" />
        </UFormField>

        <UButton :loading="loading" class="w-full justify-center mt-3 text-(--text) cursor-pointer" type="submit" @click="onSubmit({data:state})" >
            <template v-if="loading">please wait...</template>
            <template v-else>{{ title }}</template>
        </UButton>
    </UForm>
</template>
