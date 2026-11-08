<script setup lang="ts">
import type { CatalogCountry } from '@countrybox/catalog'
import { REVIEW_DIRECTIONS, eligible, parseDirection, type Direction } from '@countrybox/domain'
const props = defineProps<{ country: CatalogCountry }>()
const { t, field } = useT()
const { toast } = useFeedback()
const { queue, load, enroll } = useReviews()
onMounted(() => {
  if (!queue.value) void load()
})
const open = ref(false)
const available = computed(() => REVIEW_DIRECTIONS.filter((d) => eligible([props.country], d).length))
const enrolled = computed(
  () => new Set((queue.value?.cards ?? []).filter((c) => c.entityId === props.country.id).map((c) => c.direction)),
)
const picked = ref<Direction[]>(['flag-name', 'name-capital'])
const label = (d: string) => {
  const p = parseDirection(d)!
  return `${field(p[0])} → ${field(p[1])}`
}
async function save() {
  const dirs = picked.value.filter((d) => available.value.includes(d) && !enrolled.value.has(d))
  if (!dirs.length) {
    open.value = false
    return
  }
  if (await enroll(props.country.id, dirs)) {
    toast(t('reviews.addedToYourBox'))
    open.value = false
  } else toast(t('reviews.couldNotAddTryAgain'))
}
</script>
<template>
  <button v-if="!open" type="button" class="btn secondary" @click="open = true">
    <Icon name="plus" />{{ enrolled.size ? t('reviews.inYourBox', { n: enrolled.size }) : t('reviews.addToReviews') }}
  </button>
  <fieldset v-else class="enroll card">
    <legend class="eyebrow">{{ t('reviews.reviewTheseDirections') }}</legend>
    <div class="enroll-grid">
      <label v-for="d in available" :key="d" class="check-row"
        ><input
          v-model="picked"
          type="checkbox"
          :value="d"
          :disabled="enrolled.has(d)"
          :checked="enrolled.has(d) || picked.includes(d)"
        />{{ label(d) }}<span v-if="enrolled.has(d)" class="tag muted-tag">{{ t('reviews.inBox') }}</span></label
      >
    </div>
    <div class="row">
      <button type="button" class="btn primary" @click="save">{{ t('reviews.add') }}</button
      ><button type="button" class="btn ghost" @click="open = false">{{ t('reviews.cancel') }}</button>
    </div>
  </fieldset>
</template>
