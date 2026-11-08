<script setup lang="ts">
import type { CatalogCountry } from '@countrybox/catalog'
/**
 * anonymous: describe the artwork without naming the country (quiz options before answering).
 * decorative: empty alt — used when the name is printed next to the flag.
 */
const props = defineProps<{
  country: CatalogCountry
  anonymous?: boolean
  decorative?: boolean
  mounted?: boolean
  eager?: boolean
}>()
const { t, name } = useT()
const alt = computed(() =>
  props.decorative
    ? ''
    : props.anonymous
      ? t('common.aFlagAnswerOption')
      : t('common.flagOf', { name: name(props.country) }),
)
</script>
<template>
  <img
    class="flag"
    :class="{ mounted }"
    :src="`/catalog/flags/${country.id}.svg`"
    :alt="alt"
    width="160"
    height="120"
    :loading="eager ? 'eager' : 'lazy'"
    decoding="async"
  />
</template>
