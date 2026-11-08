<script setup lang="ts">
import type { AnswerResult, Card, Presentation } from '@countrybox/contracts'
import { parseDirection, stageIntervalDays } from '@countrybox/domain'
definePageMeta({ focus: true, title: undefined })
const { t, name, capital, value, field, region, coords } = useT()
const prefs = usePrefs()
const { byId, ready } = useCatalog()
const { user, checked, refreshDue } = useAccount()
const { announce } = useFeedback()

const cards = ref<Card[]>([])
const index = ref(0)
const pres = ref<Presentation | null>(null)
const result = ref<AnswerResult | null>(null)
const chosen = ref<string | null>(null)
const hinted = ref(false)
const error = ref<string | null>(null)
const busy = ref(false)
const results = ref<AnswerResult[]>([])
const done = ref(false)
const titleEl = ref<HTMLElement | null>(null)
const nextEl = ref<HTMLElement | null>(null)
// One idempotency key per card presentation and per answer, reused on retry.
const keys = new Map<string, string>()
const keyFor = (k: string) => {
  if (!keys.has(k)) keys.set(k, crypto.randomUUID())
  return keys.get(k)!
}

onMounted(async () => {
  await ready()
  if (!checked.value) await until(() => checked.value)
  if (!user.value) return navigateTo('/reviews', { replace: true })
  const res = await useApi().api.review.queue.$get()
  if (res.status !== 200) {
    error.value = t('reviewSession.couldNotLoadYourReviews')
    return
  }
  cards.value = (await res.json()).due
  if (!cards.value.length) {
    done.value = true
    return
  }
  await present()
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
function until(fn: () => boolean) {
  return new Promise<void>((r) => {
    const s = watch(
      fn,
      (v) => {
        if (v) {
          s()
          r()
        }
      },
      { immediate: true },
    )
  })
}

const card = computed(() => cards.value[index.value] ?? null)
const pair = computed(() => (card.value ? parseDirection(card.value.direction)! : (['flag', 'name'] as const)))
const target = computed(() => (card.value ? (byId.value.get(card.value.entityId) ?? null) : null))
const options = computed(() => (pres.value?.optionIds ?? []).map((id) => byId.value.get(id)!).filter(Boolean))
const answered = computed(() => !!result.value)
const showMap = computed(() => (answered.value ? prefs.value.map !== 'off' : hinted.value))

async function present() {
  error.value = null
  result.value = null
  chosen.value = null
  pres.value = null
  const c = card.value!
  const res = await useApi().api.review.presentations.$post({
    json: { cardId: c.id, mapPolicy: prefs.value.map, idempotencyKey: keyFor('p:' + c.id) },
  })
  if (res.status !== 201) {
    error.value = t('reviewSession.thisCardCouldNotBe')
    return
  }
  pres.value = await res.json()
  hinted.value = pres.value.hintShown
  nextTick(() => titleEl.value?.focus({ preventScroll: true }))
}
async function askHint() {
  if (!pres.value || answered.value) return
  const res = await useApi().api.review.presentations[':id'].hint.$post({ param: { id: pres.value.id } })
  if (res.status === 200) hinted.value = true
}
async function choose(id: string) {
  if (!pres.value || answered.value || busy.value) return
  busy.value = true
  chosen.value = id
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await useApi().api.review.answers.$post({
          json: { presentationId: pres.value.id, optionId: id, idempotencyKey: keyFor('a:' + pres.value.id) },
        })
        if (res.status === 200) {
          result.value = await res.json()
          results.value.push(result.value)
          announce(
            result.value.correct
              ? t('common.correct')
              : t('common.incorrectTheAnswerIs', { answer: value(target.value!, pair.value[1]) }),
          )
          nextTick(() => {
            nextEl.value?.focus({ preventScroll: true })
            nextEl.value?.scrollIntoView({ block: 'nearest' })
          })
          return
        }
        error.value = t('reviewSession.yourAnswerCouldNotBe')
        return
      } catch {
        /* network: retry with the same key */
      }
    }
    error.value = t('reviewSession.connectionLostYourAnswerWas')
    chosen.value = null
  } finally {
    busy.value = false
  }
}
async function next() {
  if (index.value >= cards.value.length - 1) {
    done.value = true
    void refreshDue()
    return
  }
  index.value++
  await present()
}
function onKey(e: KeyboardEvent) {
  const tag = (document.activeElement?.tagName ?? '').toUpperCase()
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.metaKey || e.ctrlKey || e.altKey) return
  if (/^[1-4]$/.test(e.key) && pres.value && !answered.value) {
    e.preventDefault()
    void choose(pres.value.optionIds[Number(e.key) - 1]!)
  } else if (e.key === 'Enter' && answered.value && tag !== 'BUTTON' && tag !== 'A') {
    e.preventDefault()
    void next()
  }
}
const optionState = (id: string) =>
  !answered.value
    ? chosen.value === id
      ? 'tried'
      : ''
    : id === result.value!.targetId
      ? 'correct'
      : id === chosen.value
        ? 'wrong'
        : 'dim'
const outcomeText = computed(() => {
  const r = result.value
  if (!r) return ''
  if (!r.correct) return t('reviewSession.backToTheFirstCompartment')
  if (r.assisted) return t('reviewSession.correctWithAHintStays')
  const d = stageIntervalDays(r.stageAfter)
  return t('reviewSession.movedToCompartment', { stage: r.stageAfter }, d ?? 1)
})
const correctCount = computed(() => results.value.filter((r) => r.correct).length)
const title = computed(
  () =>
    ({
      name: t('common.whichCountryIsThis'),
      capital: t('common.whatIsTheCapital'),
      flag: t('common.whichFlagBelongsHere'),
      tld: t('common.whichDomainBelongsHere'),
      callingCode: t('common.whichCallingCodeFits'),
      location: t('session.clickTheCountry'),
    })[pair.value[1]],
)
const pad = (n: number) => String(n).padStart(2, '0')
</script>

<template>
  <div v-if="done" class="empty card">
    <p class="eyebrow">{{ t('reviewSession.reviewComplete') }}</p>
    <h1 class="display sm">
      {{
        results.length
          ? t('reviewSession.ofRemembered', { correctCount, results: results.length })
          : t('reviewSession.nothingIsDueRightNow')
      }}
    </h1>
    <p class="muted">{{ t('reviewSession.cardsYouMissedComeBack') }}</p>
    <NuxtLink to="/reviews" class="btn primary">{{ t('reviewSession.backToYourBox') }}<Icon name="arrow" /></NuxtLink>
  </div>
  <div v-else-if="card && target" class="session">
    <div class="session-bar">
      <NuxtLink to="/reviews" class="icon-btn" :aria-label="t('reviewSession.leaveReview')"><Icon name="x" /></NuxtLink>
      <ol class="stops" aria-hidden="true">
        <li
          v-for="(c, i) in cards"
          :key="c.id"
          :class="i < results.length ? (results[i]!.correct ? 'ok' : 'miss') : i === index ? 'cur' : ''"
        >
          <Icon v-if="i < results.length && results[i]!.correct" name="check" /><Icon
            v-else-if="i < results.length"
            name="x"
          />
        </li>
      </ol>
      <div class="session-meta">
        <span class="mode-pill">{{ t('reviewSession.review') }}</span
        ><span class="mono counter">{{ pad(index + 1) }}<span class="muted">/{{ pad(cards.length) }}</span></span>
      </div>
    </div>
    <p v-if="error" class="alert" role="alert">
      {{ error }}
      <button v-if="!pres" type="button" class="text-link" @click="next">{{ t('reviewSession.skip') }}</button>
    </p>
    <div class="session-grid">
      <section class="question card" aria-labelledby="question-title">
        <p class="eyebrow">
          {{ field(pair[0], true) }} → {{ field(pair[1], true) }} · {{ t('reviewSession.stage') }} {{ card.stage }}
        </p>
        <h1 id="question-title" ref="titleEl" class="q-title" tabindex="-1">{{ title }}</h1>
        <div v-if="pair[0] === 'flag'" class="prompt-flag">
          <FlagImg :key="target.id" :country="target" mounted :anonymous="!answered" eager />
        </div>
        <div v-else class="prompt-text" :class="['tld', 'callingCode'].includes(pair[0]) ? 'mono' : 'serif'">
          {{ value(target, pair[0]) }}
        </div>
        <div v-if="pres" class="answers" :class="{ 'flag-answers': pair[1] === 'flag' }">
          <button
            v-for="(c, i) in options"
            :key="c.id"
            type="button"
            class="answer"
            :class="[optionState(c.id), { 'is-flag': pair[1] === 'flag' }]"
            :aria-disabled="answered || busy ? 'true' : undefined"
            @click="choose(c.id)"
          >
            <kbd aria-hidden="true">{{ i + 1 }}</kbd>
            <span class="answer-val"
              ><FlagImg v-if="pair[1] === 'flag'" :country="c" :anonymous="!answered" /><template v-else>{{
                value(c, pair[1])
              }}</template></span
            >
            <span v-if="answered && c.id === result!.targetId" class="mark ok"
              ><Icon name="check" /><span class="sr-only">{{ t('common.correctAnswer') }}</span></span
            >
            <span v-else-if="answered && c.id === chosen" class="mark no"
              ><Icon name="x" /><span class="sr-only">{{ t('common.yourAnswerIncorrect') }}</span></span
            >
          </button>
        </div>
        <p v-if="!answered" class="keyhint">
          <kbd>1</kbd>–<kbd>4</kbd> · {{ t('reviewSession.oneTryReviewsCountYour') }}
        </p>
      </section>
      <aside class="notes card" :class="answered ? (result!.correct ? 'is-ok' : 'is-miss') : ''">
        <template v-if="answered">
          <div class="verdict">
            <Icon :name="result!.correct ? 'check' : 'x'" />
            <div>
              <strong>{{ result!.correct ? t('reviewSession.remembered') : t('reviewSession.notThisTime') }}</strong
              ><small>{{ outcomeText }}</small>
            </div>
          </div>
        </template>
        <template v-else>
          <p class="eyebrow">{{ t('common.fieldNotes') }}</p>
          <p class="muted">{{ t('reviewSession.takeYourTimeAHint') }}</p>
          <button v-if="!hinted && target.map" type="button" class="btn secondary" @click="askHint">
            <Icon name="map" />{{ t('reviewSession.showLocationHint') }}
          </button>
        </template>
        <div v-if="showMap && target.map" class="notes-map">
          <WorldMap
            :focus="target.id"
            :highlight="target.id"
            :pins="[target]"
            :label="t('common.locationOf', { name: name(target) })"
          /><span v-if="!answered" class="map-flag">{{ t('common.hint') }}</span>
        </div>
        <template v-if="answered">
          <h2 class="serif notes-name">{{ name(target) }}</h2>
          <dl class="facts">
            <div>
              <dt>{{ t('common.capital') }}</dt>
              <dd>{{ capital(target) }}</dd>
            </div>
            <div>
              <dt>{{ t('common.region') }}</dt>
              <dd>{{ region(target.region) }}</dd>
            </div>
            <div>
              <dt>{{ t('common.domain') }}</dt>
              <dd class="mono">{{ target.tlds.join(' ') || '—' }}</dd>
            </div>
            <div>
              <dt>{{ t('common.calling') }}</dt>
              <dd class="mono">{{ target.callingCodes.map((x) => '+' + x).join(' ') || '—' }}</dd>
            </div>
          </dl>
          <p v-if="target.center" class="mono small muted">{{ coords(target) }}</p>
          <button ref="nextEl" type="button" class="btn primary wide" @click="next">
            {{ index >= cards.length - 1 ? t('reviewSession.finish') : t('reviewSession.nextCard')
            }}<Icon name="arrow" />
          </button>
          <p class="hint center"><kbd>Enter</kbd> {{ t('common.toContinue') }}</p>
        </template>
      </aside>
    </div>
  </div>
  <div v-else-if="error" class="empty card">
    <p class="alert">{{ error }}</p>
    <NuxtLink to="/reviews" class="btn secondary">{{ t('reviewSession.back') }}</NuxtLink>
  </div>
</template>
