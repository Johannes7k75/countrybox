<script setup lang="ts">
import { DIRECTIONS, DRILL_DIRECTIONS, eligible } from '@countrybox/domain'
const route = useRoute()
const router = useRouter()
const { t, name, capital, region, coords, value } = useT()
const { byId, countries } = useCatalog()
const familiarity = useFamiliarity()
const { start } = usePractice()
const { user } = useAccount()

const c = computed(() => byId.value.get(String(route.params.id)) ?? null)
useHead(() => ({ title: c.value ? `${name(c.value)} · CountryBox` : 'CountryBox' }))
const directions = computed(() => (c.value ? DIRECTIONS.filter((d) => eligible([c.value!], d).length) : []))
const sameFlag = computed(() =>
  c.value ? countries.value.filter((x) => x.flagKey === c.value!.flagKey && x.id !== c.value!.id) : [],
)
const sameCode = computed(() =>
  c.value
    ? countries.value.filter(
        (x) => x.id !== c.value!.id && x.callingCodes.some((k) => c.value!.callingCodes.includes(k)),
      )
    : [],
)
/** Country drill: one question per supported direction, distractors from the same subregion/region. */
const drill = computed(() => (c.value ? DRILL_DIRECTIONS.filter((d) => eligible([c.value!], d).length) : []))
const prefs = usePrefs()
function practise() {
  start({
    direction: drill.value[0]!,
    directions: drill.value,
    scope: 'all',
    region: 'world',
    length: drill.value.length,
    mode: 'practice',
    targetIds: [c.value!.id],
    mapPrompt: prefs.value.setup.mapPrompt,
    mapClick: prefs.value.setup.mapClick,
  })
}
function back() {
  if (window.history.length > 1) router.back()
  else navigateTo('/explore')
}
</script>

<template>
  <div v-if="c" class="atlas-page-wrap">
    <button type="button" class="text-link back-link" @click="back">
      <Icon name="back" />{{ t('country.backToTheAtlas') }}
    </button>
    <article class="atlas-page card">
      <div class="ap-map">
        <WorldMap
          v-if="c.map"
          :focus="c.id"
          :highlight="c.id"
          :pins="[c]"
          :label="t('common.locationOf', { name: name(c) })"
        />
        <p v-else class="ap-nomap">{{ t('country.noMapOutlineForThis') }}</p>
        <span v-if="c.center" class="ap-coords mono">{{ coords(c) }}</span>
      </div>
      <div class="ap-body">
        <p class="eyebrow">{{ region(c.region) }} · {{ c.subregion }}</p>
        <div class="ap-title">
          <FlagImg :country="c" mounted eager />
          <h1 class="serif">{{ name(c) }}</h1>
        </div>
        <dl class="facts">
          <div>
            <dt>{{ c.capitals.en.length > 1 ? t('country.capitals') : t('common.capital') }}</dt>
            <dd>{{ capital(c) }}</dd>
          </div>
          <div>
            <dt>{{ t('common.domain') }}</dt>
            <dd class="mono">{{ value(c, 'tld') || '—' }}</dd>
          </div>
          <div>
            <dt>{{ t('country.callingCode') }}</dt>
            <dd class="mono">{{ value(c, 'callingCode') || '—' }}</dd>
          </div>
          <div>
            <dt>{{ t('country.unMember') }}</dt>
            <dd>{{ c.un ? t('country.yes') : t('country.no') }}</dd>
          </div>
        </dl>
        <p v-if="sameCode.length" class="hint">
          {{ t('country.sharesItsCallingCodeWith') }} {{ sameCode.slice(0, 6).map(name).join(', ')
          }}{{ sameCode.length > 6 ? ' …' : '' }}.
        </p>
        <p v-if="sameFlag.length" class="hint">
          {{ t('country.usesTheSameFlagAs') }} {{ sameFlag.map(name).join(', ') }}.
        </p>
        <div class="ap-progress">
          <span v-if="familiarity[c.id] !== undefined"
            >{{ t('country.onThisDevice') }}: <StageDots :stage="familiarity[c.id]!"
          /></span>
          <span v-else class="muted">{{ t('country.notPractisedOnThisDevice') }}</span>
          <span class="muted">{{
            t('country.directionsAvailable', { n: directions.length, total: DIRECTIONS.length })
          }}</span>
        </div>
        <p class="hint">{{ t('country.theDrillAsksAboutThis') }}</p>
        <div class="row">
          <button type="button" class="btn primary" @click="practise">
            {{ t('country.learnThisCountryWays', drill.length) }}<Icon name="arrow" />
          </button>
          <ReviewEnroll v-if="user" :country="c" />
        </div>
      </div>
    </article>
  </div>
  <div v-else class="empty card">
    <h1 class="display sm">{{ t('country.notInTheAtlas') }}</h1>
    <NuxtLink to="/explore" class="btn secondary">{{ t('country.backToTheAtlas') }}</NuxtLink>
  </div>
</template>
