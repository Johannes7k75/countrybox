<script setup lang="ts">
import { directionOf, firstTryCorrect, reverseDirection, type Field } from '@countrybox/domain'
const { t, name, capital, coords, field, dateLocale } = useT()
const prefs = usePrefs()
const { countries, byId } = useCatalog()
const { finished, active } = useHistory()
const familiarity = useFamiliarity()
const { user } = useAccount()
const dueCount = useState<number>('due-count', () => 0)
const { start } = usePractice()

const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 5
    ? t('today.goodNight')
    : h < 12
      ? t('today.goodMorning')
      : h < 18
        ? t('today.goodAfternoon')
        : t('today.goodEvening')
})
const today = computed(() =>
  new Date().toLocaleDateString(dateLocale.value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
)
const spotlight = computed(() => {
  const pool = countries.value.filter((c) => c.un && c.map)
  if (!pool.length) return null
  const d = new Date()
  return pool[(d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % pool.length]!
})
const practised = computed(() => Object.keys(familiarity.value).length)
const recentMisses = computed(() => {
  const ids: string[] = []
  for (const s of finished.value.slice(0, 5))
    for (const q of s.questions)
      if (q.guesses.length && !firstTryCorrect(q) && !ids.includes(q.targetId)) ids.push(q.targetId)
  return ids
    .slice(0, 6)
    .map((id) => byId.value.get(id))
    .filter((c) => !!c)
})
const last = computed(() => finished.value[0]?.config.direction ?? null)
const routes: [Field, Field][] = [
  ['flag', 'name'],
  ['name', 'capital'],
  ['capital', 'name'],
  ['tld', 'name'],
  ['callingCode', 'name'],
]
const lastLabel = computed(() => {
  if (!last.value) return null
  const [a, b] = last.value.split('-') as [Field, Field]
  return `${field(a)} → ${field(b)}`
})

function quick() {
  start({ direction: 'flag-name', scope: 'un', region: 'world', length: 10, mode: 'practice' })
}
function route(a: Field, b: Field) {
  start({
    direction: directionOf(a, b),
    scope: prefs.value.setup.scope,
    region: 'world',
    length: prefs.value.setup.length,
    mode: 'practice',
  })
}
function practiseMisses() {
  const d = finished.value[0]?.config.direction ?? 'flag-name'
  start({
    direction: d,
    directions: [d, reverseDirection(d)],
    scope: 'all',
    region: 'world',
    length: Math.min(12, recentMisses.value.length * 2),
    mode: 'practice',
    targetIds: recentMisses.value.map((c) => c.id),
  })
}
</script>

<template>
  <div>
    <header class="page-head">
      <p class="eyebrow">{{ today }}</p>
      <h1 class="display">{{ greeting }}, <em>{{ user ? user.name : t('today.explorer') }}</em>.</h1>
      <p class="lede">
        <template v-if="user && dueCount">{{ t('today.cardsAreReadyToRevisit', dueCount) }}</template>
        <template v-else>{{ t('today.aFewMinutesALittle') }}</template>
      </p>
    </header>

    <section class="atlas-hero" aria-labelledby="hero-title">
      <div class="atlas-hero-map">
        <WorldMap :tint="familiarity" />
        <div class="hero-legend">
          <div class="legend" aria-hidden="true">
            <span>{{ t('today.seen') }}</span><i v-for="s in 6" :key="s" class="sw" :class="`s${s - 1}`" /><span>{{
              t('today.confident')
            }}</span>
          </div>
          <span class="sample">{{
            practised ? t('today.countriesPractisedOnThisDevice', practised) : t('today.yourMapFillsInAs')
          }}</span>
        </div>
      </div>
      <div class="hero-card">
        <p class="eyebrow">{{ t('today.quickStart') }}</p>
        <h2 id="hero-title">{{ t('today.putAName') }} {{ t('today.toTheFlag') }}</h2>
        <div class="route-line" aria-hidden="true">
          <span class="route-node"><Icon name="f_flag" /></span><i /><span class="route-node"
            ><Icon name="f_name"
          /></span>
        </div>
        <p class="muted">{{ t('today.tenFlagsOfUnMember') }}</p>
        <div class="row">
          <button type="button" class="btn primary" @click="quick">
            {{ t('today.startPractice') }}<Icon name="arrow" />
          </button>
          <NuxtLink to="/practice" class="btn ghost">{{ t('today.customise') }}</NuxtLink>
        </div>
      </div>
    </section>

    <div class="home-grid">
      <section class="card due-card" aria-labelledby="next-title">
        <template v-if="active">
          <div class="card-head"><h2 id="next-title">{{ t('today.pickUpWhereYouLeft') }}</h2></div>
          <p class="muted">
            {{ field(active.config.direction.split('-')[0] as Field) }} →
            {{ field(active.config.direction.split('-')[1] as Field) }} · {{ t('today.question') }}
            {{ active.index + 1 }} / {{ active.questions.length }}
          </p>
          <NuxtLink :to="`/practice/session/${active.id}`" class="btn primary wide" style="margin-top: 16px"
            >{{ t('today.resume') }}<Icon name="arrow"
          /></NuxtLink>
        </template>
        <template v-else-if="recentMisses.length">
          <div class="card-head">
            <h2 id="next-title">{{ t('today.worthAnotherLook') }}</h2>
            <span class="sample">{{ t('today.recentMisses') }}</span>
          </div>
          <div class="flag-stack" aria-hidden="true">
            <span v-for="(c, i) in recentMisses.slice(0, 4)" :key="c.id" :style="{ '--i': i }"
              ><FlagImg :country="c" decorative
            /></span>
          </div>
          <ul class="mini-list">
            <li v-for="c in recentMisses" :key="c.id">
              <span class="mini-flag"><FlagImg :country="c" decorative /></span
              ><span><strong>{{ name(c) }}</strong><small>{{ capital(c) }}</small></span>
            </li>
          </ul>
          <button type="button" class="btn primary wide" @click="practiseMisses">
            {{ t('today.practiseThese') }}<Icon name="arrow" />
          </button>
        </template>
        <template v-else>
          <div class="card-head"><h2 id="next-title">{{ t('today.readyToRevisit') }}</h2></div>
          <p class="muted">{{ user ? t('today.yourReviewBoxIsEmpty') : t('today.countriesYouMissShowUp') }}</p>
          <NuxtLink :to="user ? '/reviews' : '/account'" class="text-link" style="margin-top: 16px"
            >{{ user ? t('today.openReviews') : t('today.aboutAccounts') }} <Icon name="arrow"
          /></NuxtLink>
        </template>
      </section>

      <section v-if="spotlight" class="card spotlight" aria-labelledby="sp-title">
        <p class="eyebrow">{{ t('today.countryOfTheDay') }}</p>
        <div class="spot-map">
          <WorldMap :focus="spotlight.id" :highlight="spotlight.id" :pins="[spotlight]" /><span class="spot-flag"
            ><FlagImg :country="spotlight" mounted decorative
          /></span>
        </div>
        <h2 id="sp-title" class="serif">{{ name(spotlight) }}</h2>
        <p class="mono small">{{ coords(spotlight) }}</p>
        <p class="muted">
          {{ t('common.capital') }}: <strong>{{ capital(spotlight) }}</strong> · {{ spotlight.tlds.join(' ') }} ·
          {{ spotlight.callingCodes.map((x) => '+' + x).join(' ') }}
        </p>
        <NuxtLink :to="`/explore/${spotlight.id}`" class="text-link"
          >{{ t('today.openAtlasPage') }} <Icon name="arrow"
        /></NuxtLink>
      </section>

      <section class="card routes" aria-labelledby="routes-title">
        <div class="card-head"><h2 id="routes-title">{{ t('today.chooseARoute') }}</h2></div>
        <p v-if="lastLabel" class="muted small">{{ t('today.lastTime') }}: <strong>{{ lastLabel }}</strong></p>
        <ul class="route-list">
          <li v-for="[a, b] in routes" :key="a + b">
            <button type="button" class="route-btn" @click="route(a, b)">
              <span class="route-glyphs"><Icon :name="`f_${a}`" /><i /><Icon :name="`f_${b}`" /></span>
              <span
                >{{ field(a) }} <span aria-hidden="true">→</span><span class="sr-only">{{ t('today.to') }}</span>
                {{ field(b) }}</span
              >
              <Icon name="arrow" class="go" />
            </button>
          </li>
        </ul>
        <NuxtLink to="/practice" class="text-link">{{ t('today.all20Directions') }} <Icon name="arrow" /></NuxtLink>
      </section>
    </div>
  </div>
</template>
