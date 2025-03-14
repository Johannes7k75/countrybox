<script lang="ts" setup>
import { object, string, z } from "zod";
import type { FormError, FormErrorEvent, FormSubmitEvent } from "@nuxt/ui";

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  repeatPassword: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits<{ onSubmit: [data: { email: string; password: string }] }>();

const schema = object({
  email: string(),
  password: string().min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  email: undefined,
  password: undefined,
});

const passwordRepeat = ref<string>();

async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log("Form Submitted!", event.data);
  emit("onSubmit", schema.parse(event.data));
}

async function onError(event: FormErrorEvent) {
  if (event?.errors?.[0]?.id) {
    const element = document.getElementById(event.errors[0].id);
    element?.focus();
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function validate(state: any): FormError[] {
  const errors: FormError[] = [];
  if (!state.email) errors.push({ name: "email", message: "Required" });
  if (!state.password) errors.push({ name: "password", message: "Required" });
  if (state.password !== passwordRepeat.value) errors.push({ name: "passwordRepeat", message: "Müssen gleich sein" });
  return errors;
}

async function generateAccountId() {
  const newAccountId = await $fetch("/auth/accountId")

  state.email = newAccountId
}
</script>

<template>
  <h1 class="w-full text-center">{{ title }}</h1>
  <UForm :validate="validate" :schema="schema" :state="state" @submit="onSubmit" @error="onError">
    <!-- <UFormField :label="$t('auth.uuid')" name="uuid" required>
      <UInput v-model="state.uuid" class="w-full" />
    </UFormField> -->

    <UFormField :label="$t('auth.password')" name="password" required>
      <UInput v-model="state.password" type="password" class="w-full" />
    </UFormField>

    <UFormField :label="$t('auth.passwordRepeat')" name="passwordRepeat" required v-if="repeatPassword">
      <UInput v-model="passwordRepeat" type="password" class="w-full" />
    </UFormField>

    <UButton :loading="loading" :disabled="typeof state.email === 'string'" class="mt-3 w-full cursor-pointer justify-center text-(--text)" type="submit" @click="generateAccountId">
      <template v-if="loading">please wait...</template>
      <template v-else>{{ label }}</template>
    </UButton>

    <div class="w-full mt-8 p-4 border-(--primary) rounded-md border" v-show="typeof state.email === 'string'">
      {{ $t('auth.anonym.yourAccountId') }}

      <code>{{ state.email }}</code>

      <UButton :label="$t('auth.anonym.accountIdSaved')" @click="onSubmit({data: state})"/>

    </div>

  </UForm>
</template>
