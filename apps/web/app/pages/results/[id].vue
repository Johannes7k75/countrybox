<script setup lang="ts">
import {
  firstTryCorrect,
  livesLeft,
  parseDirection,
  questionDirection,
  reverseDirection,
  summarize,
  type Field,
  type Session,
} from '@countrybox/domain'
definePageMeta({ title: undefined })
const route = useRoute()
const { t, name, value, field } = useT()
const { byId, ready } = useCatalog()
const { get } = useHistory()
const { start } = usePractice()
const s = shallowRef<Session | null>(null)
const missing = ref(false)
onMounted(async () => {
  await ready()
  s.value = await get(String(route.params.id))
  if (!s.value) missing.value = true
  else if (s.value.status !== 'finished') navigateTo(`/practice/session/${s.value.id}`, { replace: true })
})
const sum = computed(() => (s.value ? summarize(s.value) : null))
const pair = computed(() =>
  s.value ? parseDirection(s.value.config.direction)! : (['flag', 'name'] as [Field, Field]),
)
const outOfLives = computed(
  () => !!s.value && livesLeft(s.value) === 0 && sum.value!.answered < s.value.questions.length,
)
const marks = computed(() => {
  const m: Record<string, 'ok' | 'miss'> = {}
  for (const q of s.value?.questions ?? [])
    if (q.resolved) m[q.targetId] = firstTryCorrect(q) && m[q.targetId] !== 'miss' ? 'ok' : 'miss'
  return m
})
const mixed = computed(() => (s.value?.config.directions?.length ?? 0) > 1)
const recap = computed(() =>
  (s.value?.questions ?? [])
    .filter((q) => q.resolved)
    .map((q) => ({
      q,
      pair: parseDirection(questionDirection(s.value!, q))!,
      c: byId.value.get(q.targetId)!,
      first: q.guesses[0] ? byId.value.get(q.guesses[0]) : undefined,
      ok: firstTryCorrect(q),
    })),
)
const R = 52,
  circ = 2 * Math.PI * R
const minutes = computed(() => Math.max(1, Math.round((sum.value?.durationMs ?? 0) / 60000)))

function again(cfg: Partial<Session['config']> = {}) {
  const c = s.value!.config
  start({
    direction: c.direction,
    scope: c.scope,
    region: c.region,
    length: c.length,
    mode: c.mode,
    difficulty: c.difficulty ?? 'standard',
    ...(c.mapPrompt ? { mapPrompt: c.mapPrompt } : {}),
    ...(c.mapClick ? { mapClick: c.mapClick } : {}),
    ...(c.targetIds ? { targetIds: c.targetIds } : {}),
    ...cfg,
  })
}
// Drill each missed country both ways (prompt→answer and back), so it is not the same question repeated.
function misses() {
  const ids = sum.value!.missedIds
  const d = s.value!.config.direction
  again({
    targetIds: ids,
    direction: d,
    directions: mixed.value ? s.value!.config.directions! : [d, reverseDirection(d)],
    length: Math.min(20, ids.length * 2),
    mode: 'practice',
    scope: 'all',
  })
}
function reverse() {
  const [a, b] = pair.value
  again({ direction: `${b}-${a}` })
}
</script>

<template>
  <div v-if="missing" class="empty card">
    <h1 class="display sm">{{ t('results.yourNextDiscoveryAwaits') }}</h1>
    <p class="muted">{{ t('results.theseResultsAreNotStored') }}</p>
    <NuxtLink to="/practice" class="btn primary">{{ t('common.planASession') }}</NuxtLink>
  </div>
  <div v-else-if="s && sum">
    <header class="page-head">
      <p class="eyebrow">
        {{ outOfLives ? t('results.outOfLives') : t('results.journeyComplete') }} ·
        {{ mixed ? t('results.mixedDirections') : `${field(pair[0], true)} → ${field(pair[1], true)}`
        }}{{ s.config.difficulty === 'hard' ? ' · ' + t('common.lookAlikes') : '' }}
      </p>
      <h1 class="display">
        <template v-if="sum.accuracy >= 80"
          >{{ t('results.goodConnections') }} <em>{{ t('results.keepThemGrowing') }}</em></template
        >
        <template v-else>{{ t('results.everyAttempt') }} <em>{{ t('results.addsALittleMore') }}</em></template>
      </h1>
    </header>
    <section class="result-hero card">
      <div class="score">
        <svg viewBox="0 0 120 120" class="ring" aria-hidden="true">
          <circle cx="60" cy="60" :r="R" class="ring-bg" />
          <circle
            cx="60"
            cy="60"
            :r="R"
            class="ring-fg"
            :style="{
              strokeDasharray: circ.toFixed(1),
              strokeDashoffset: (circ * (1 - sum.accuracy / 100)).toFixed(1),
            }"
          />
        </svg>
        <div class="score-text">
          <strong class="num">{{ sum.accuracy }}<small>%</small></strong
          ><span>{{ t('results.firstTryAccuracy') }}</span>
        </div>
      </div>
      <dl class="result-stats">
        <div>
          <dt>{{ t('results.firstTry') }}</dt>
          <dd class="num">{{ sum.firstTryCorrect }}<span class="muted">/{{ sum.answered }}</span></dd>
        </div>
        <div>
          <dt>{{ t('results.countries') }}</dt>
          <dd class="num">{{ sum.countryIds.length }}</dd>
        </div>
        <div v-if="sum.assisted">
          <dt>{{ t('results.withMapHint') }}</dt>
          <dd class="num">{{ sum.assisted }}</dd>
        </div>
        <div v-else>
          <dt>{{ t('results.time') }}</dt>
          <dd class="num">~{{ minutes }}<span class="muted"> min</span></dd>
        </div>
      </dl>
      <div class="result-map">
        <WorldMap :marks="marks" :dots="marks" :label="t('results.countriesFromThisSessionFirst')" />
        <div class="legend">
          <span><i class="sw ok" />{{ t('results.firstTry') }}</span
          ><span><i class="sw miss" />{{ t('results.missed') }}</span>
        </div>
      </div>
    </section>
    <div class="results-grid">
      <section class="card">
        <div class="card-head">
          <h2>{{ t('results.yourRoute') }}</h2>
          <span class="small muted num">{{ t('common.stops', recap.length) }}</span>
        </div>
        <ol class="recap">
          <li v-for="(r, i) in recap" :key="i" :class="r.ok ? 'ok' : 'miss'">
            <span class="idx num">{{ String(i + 1).padStart(2, '0') }}</span>
            <NuxtLink :to="`/explore/${r.c.id}`" class="mini-flag"
              ><FlagImg :country="r.c" decorative /><span class="sr-only">{{ name(r.c) }}</span></NuxtLink
            >
            <span class="recap-main">
              <strong
                >{{ name(r.c)
                }}<span v-if="mixed" class="recap-dir"> · {{ field(r.pair[0]) }} → {{ field(r.pair[1]) }}</span></strong
              >
              <small v-if="r.ok">{{
                ['name', 'flag', 'location'].includes(r.pair[1]) ? value(r.c, 'capital') : value(r.c, r.pair[1])
              }}</small>
              <small v-else-if="r.q.revealed && !r.first"
                >{{ t('results.answerShown') }}: {{ r.pair[1] === 'flag' ? name(r.c) : value(r.c, r.pair[1]) }}</small
              >
              <small v-else
                >{{ t('results.firstPick') }}:
                {{ r.first ? (r.pair[1] === 'flag' ? name(r.first) : value(r.first, r.pair[1])) : '—' }} ·
                {{ t('results.answer') }}: {{ r.pair[1] === 'flag' ? name(r.c) : value(r.c, r.pair[1]) }}</small
              >
            </span>
            <span v-if="r.q.assisted" class="tag" :title="t('results.mapWasVisibleBeforeAnswering')">{{
              t('common.hint')
            }}</span>
            <span class="mark" :class="r.ok ? 'ok' : 'no'"
              ><Icon :name="r.ok ? 'check' : 'x'" /><span class="sr-only">{{
                r.ok ? t('results.correct') : t('results.missed2')
              }}</span></span
            >
          </li>
        </ol>
      </section>
      <section class="card next-card">
        <h2>{{ t('results.whereNext') }}</h2>
        <template v-if="sum.missedIds.length">
          <p class="muted">{{ t('results.countriesAreWorthAnotherLook', sum.missedIds.length) }}</p>
          <button type="button" class="btn primary wide" @click="misses">
            {{ t('results.practiseMyMisses') }}<Icon name="arrow" />
          </button>
        </template>
        <template v-else-if="!mixed">
          <p class="muted">{{ t('results.aCleanRunTryThe') }}</p>
          <button type="button" class="btn primary wide" @click="reverse">
            {{ t('results.tryTheReverse') }}<Icon name="swap" />
          </button>
        </template>
        <button type="button" class="btn secondary wide" @click="again()">{{ t('results.sameRouteAgain') }}</button>
        <NuxtLink to="/practice" class="btn ghost wide">{{ t('results.changeMyPlan') }}</NuxtLink>
        <p class="hint">{{ t('results.practiceNeverChangesYourReview') }}</p>
      </section>
    </div>
  </div>
</template>
