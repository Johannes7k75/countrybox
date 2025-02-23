<script lang="ts" setup>
import { object, string, z } from 'zod'
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types'

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

function onSubmit(event: FormSubmitEvent<Schema>) {
    console.log("Form Submitted!", event.data)
    emit("onSubmit", schema.parse(event.data))
}

const schema = object({
    email: string().email("Invalid email"),
    password: string().min(8, "Must be at least 8 characters"),
})

type Schema = z.output<typeof schema>

const state = reactive({
    email: undefined,
    password: undefined,
    passwordRepeat: undefined
})

async function onError(event: FormErrorEvent) {
    const element = document.getElementById(event.errors[0].id)
    element?.focus()
    element?.scrollIntoView({ behavior: "smooth", block: "center" })
}

function validate(state: any): FormError[] {
    const errors = []
    if (!state.email) errors.push({ path: 'email', message: 'Required' })
    if (!state.password) errors.push({ path: 'password', message: 'Required' })
    if (state.password !== state.passwordRepeat) errors.push({ path: "passwordRepeat", message: "Müssen gleich sein" })
    return errors
}
</script>

<template>

    <h1 class="w-full text-center">{{ title }}</h1>
    <UForm :validate="validate" :schema="schema" :state="state" @submit="onSubmit" @error="onError">
        <UFormGroup :label="$t('auth.email')" name="email" required>
            <UInput v-model="state.email" />
        </UFormGroup>

        <UFormGroup :label="$t('auth.password')" name="password" required>
            <UInput v-model="state.password" type="password" />
        </UFormGroup>

        <UFormGroup :label="$t('auth.passwordRepeat')" name="passwordRepeat" required v-if="repeatPassword">
            <UInput v-model="state.passwordRepeat" type="password" />
        </UFormGroup>

        <UButton :loading="loading" class="w-full justify-center mt-3" @click="onSubmit({data:state})">
            <template v-if="loading">please wait...</template>
            <template v-else>{{ title }}</template>
        </UButton>
    </UForm>
</template>
