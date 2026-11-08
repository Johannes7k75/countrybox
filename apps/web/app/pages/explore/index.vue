<script setup lang="ts">
import { REGIONS, type Region } from '@countrybox/catalog'
import { normalize } from '@countrybox/domain'
const route = useRoute()
const router = useRouter()
const { t, name, capital, region: regionName } = useT()
const { countries } = useCatalog()
const familiarity = useFamiliarity()
const { announce } = useFeedback()

// Filters live in the URL so Back/Forward and reload restore them.
const q = ref(String(route.query.q ?? ''))
const region = computed<Region | 'world'>(() =>
  (REGIONS as readonly string[]).includes(String(route.query.region)) ? (route.query.region as Region) : 'world',
)
const scope = computed<'un' | 'all'>(() => (route.query.scope === 'all' ? 'all' : 'un'))
const view = computed<'grid' | 'map'>(() => (route.query.view === 'map' ? 'map' : 'grid'))
function setQuery(patch: Record<string, string | undefined>) {
  const query = { ...route.query, ...patch }
  for (const k of Object.keys(query)) if (query[k] === undefined || query[k] === '') delete query[k]
  router.replace({ query })
}
let debounce: ReturnType<typeof setTimeout> | undefined
watch(q, (v) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => setQuery({ q: v || undefined }), 200)
})

const list = computed(() => {
  const needle = normalize(q.value)
  return countries.value
    .filter(
      (c) =>
        (scope.value === 'all' || c.un) &&
        (region.value === 'world' || c.region === region.value) &&
        (!needle ||
          normalize(
            [
              c.name.en,
              c.name.de,
              ...c.capitals.en,
              ...c.capitals.de,
              ...c.tlds,
              ...c.callingCodes.map((x) => '+' + x),
              c.iso3,
            ].join(' '),
          ).includes(needle)),
    )
    .sort((a, b) => name(a).localeCompare(name(b)))
})
watch(
  () => list.value.length,
  (n) => announce(t('common.countriesFound', n)),
)
const regions: (Region | 'world')[] = ['world', ...REGIONS]
function clear() {
  q.value = ''
  router.replace({ query: {} })
}
</script>

<template>
  <div>
    <header class="page-head">
      <h1 class="display">{{ t('atlas.followYour') }} <em>{{ t('atlas.curiosity') }}</em>.</h1>
      <p class="lede">{{ t('atlas.flagsPlacesAndTheSmall') }}</p>
    </header>
    <div class="atlas-tools">
      <label class="search"
        ><Icon name="search" /><span class="sr-only">{{ t('atlas.searchCountriesCapitalsDomainsAnd') }}</span>
        <input v-model="q" type="search" :placeholder="t('atlas.searchLisbonTokioBrOr')" autocomplete="off"
      /></label>
      <div class="seg" role="group" :aria-label="t('atlas.view')">
        <button type="button" :aria-pressed="view === 'grid'" @click="setQuery({ view: undefined })">
          <Icon name="grid" /><span>{{ t('atlas.cards') }}</span>
        </button>
        <button type="button" :aria-pressed="view === 'map'" @click="setQuery({ view: 'map' })">
          <Icon name="map" /><span>{{ t('atlas.map') }}</span>
        </button>
      </div>
    </div>
    <div class="atlas-filters">
      <div class="chips" role="group" :aria-label="t('common.region')">
        <button
          v-for="r in regions"
          :key="r"
          type="button"
          class="chip"
          :aria-pressed="region === r"
          @click="setQuery({ region: r === 'world' ? undefined : r })"
        >
          {{ regionName(r) }}
        </button>
      </div>
      <div class="seg" role="group" :aria-label="t('common.scope')">
        <button type="button" :aria-pressed="scope === 'un'" @click="setQuery({ scope: undefined })">
          {{ t('common.unMembers') }}
        </button>
        <button type="button" :aria-pressed="scope === 'all'" @click="setQuery({ scope: 'all' })">
          {{ t('atlas.all') }}
        </button>
      </div>
    </div>
    <p class="count-line small num">{{ t('common.countries', list.length) }}</p>

    <div v-if="!list.length" class="empty card">
      <h2 class="serif">{{ t('atlas.noCountryMatches') }}</h2>
      <p class="muted">{{ t('atlas.tryACountryCapitalDomain') }}</p>
      <button type="button" class="btn secondary" @click="clear">{{ t('atlas.clearFilters') }}</button>
    </div>
    <div v-else-if="view === 'map'" class="card atlas-map-card">
      <WorldMap
        :tint="Object.fromEntries(list.map((c) => [c.id, 'x']))"
        :interactive="list.map((c) => c.id)"
        @select="(id) => navigateTo(`/explore/${id}`)"
      />
      <p class="hint">{{ t('atlas.selectAHighlightedCountryTo') }}</p>
    </div>
    <ul v-else class="specimens">
      <li v-for="c in list" :key="c.id">
        <NuxtLink :to="`/explore/${c.id}`" class="specimen">
          <span class="spec-no mono">{{ c.iso3 }}</span>
          <span class="spec-flag"><FlagImg :country="c" mounted decorative /></span>
          <span class="spec-body"
            ><strong class="serif">{{ name(c) }}</strong
            ><span class="spec-cap"><Icon name="pin" />{{ capital(c) }}</span></span
          >
          <span class="spec-foot"
            ><span class="mono">{{ c.tlds.join(' ') }}</span
            ><span class="mono">{{ c.callingCodes.map((x) => '+' + x).join(' ') }}</span>
            <StageDots v-if="familiarity[c.id] !== undefined" :stage="familiarity[c.id]!" /><span
              v-else-if="!c.un"
              class="tag muted-tag"
              >{{ t('atlas.territory') }}</span
            ></span
          >
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
