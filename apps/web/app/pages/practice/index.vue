<script setup lang="ts">
import { REGIONS, type Region } from '@countrybox/catalog'
import {
  DIRECTIONS,
  FIELDS,
  MAP_CLICK_STYLES,
  MAP_PROMPT_STYLES,
  MAX_SESSION_LENGTH,
  isClickAnswer,
  isMapPrompt,
  SESSION_LENGTHS,
  buildFromTiers,
  chooseStrategy,
  createRng,
  directionHasFlag,
  directionOf,
  eligible,
  sessionPool,
  type Field,
} from '@countrybox/domain'
definePageMeta({ title: undefined })
const { t, field, region: regionName, value } = useT()
const prefs = usePrefs()
const { countries, byId } = useCatalog()
const { start } = usePractice()
const { neighbors, load: loadNeighbors } = useNeighbors()
const setup = computed(() => prefs.value.setup)
const direction = computed(() => directionOf(setup.value.prompt, setup.value.answer))
const flagDirection = computed(() => directionHasFlag(direction.value))
const mapPrompt = computed(() => isMapPrompt(direction.value))
const mapClick = computed(() => isClickAnswer(direction.value))
const promptStyles = MAP_PROMPT_STYLES.map((k) => ({
  k,
  label: { 'outline-capital': 'map.styleOutlineCapital', outline: 'map.styleOutline', capital: 'map.styleCapital' }[k],
  hint: {
    'outline-capital': 'map.styleOutlineCapitalHint',
    outline: 'map.styleOutlineHint',
    capital: 'map.styleCapitalHint',
  }[k],
}))
const clickStyles = MAP_CLICK_STYLES.map((k) => ({
  k,
  label: k === 'borders' ? 'map.styleBorders' : 'map.styleSilhouette',
  hint: k === 'borders' ? 'map.styleBordersHint' : 'map.styleSilhouetteHint',
}))
const sample = computed(() => byId.value.get('it') ?? countries.value[0])
// Load the neighbour pack only once hard mode is chosen (immediate: must run after `setup` exists).
watch(
  () => setup.value.difficulty,
  (d) => {
    if (d === 'hard') void loadNeighbors()
  },
  { immediate: true },
)
const regions: (Region | 'world')[] = ['world', ...REGIONS]
const poolSize = (region: Region | 'world', scope = setup.value.scope) =>
  sessionPool(countries.value, { direction: direction.value, scope, region }).length
const pool = computed(() =>
  sessionPool(countries.value, { direction: direction.value, scope: setup.value.scope, region: setup.value.region }),
)
const custom = ref(!SESSION_LENGTHS.includes(setup.value.length as 5))

function pickPrompt(f: Field) {
  setup.value.prompt = f
  if (setup.value.answer === f) setup.value.answer = FIELDS.find((x) => x !== f)!
}
function swap() {
  const { prompt, answer } = setup.value
  setup.value.prompt = answer
  setup.value.answer = prompt
}
function setLength(n: number) {
  custom.value = false
  setup.value.length = n
}
function onCustom(e: Event) {
  const n = Number((e.target as HTMLInputElement).value)
  if (Number.isFinite(n)) setup.value.length = Math.max(1, Math.min(MAX_SESSION_LENGTH, Math.round(n)))
}

const preview = computed(() => {
  const p = pool.value
  if (!p.length) return null
  const rng = createRng(7)
  const global = eligible(countries.value, direction.value)
  const strategy = chooseStrategy(direction.value, setup.value.difficulty ?? 'standard', p.length, neighbors.value)
  const q = buildFromTiers(
    p[0]!,
    direction.value,
    strategy.tiers(p[0]!, direction.value, { pool: p, global, rng, neighbors: neighbors.value }),
    rng,
  )
  if (!q) return null
  return { target: byId.value.get(q.targetId)!, options: q.optionIds.map((id) => byId.value.get(id)!) }
})
const repeats = computed(() => pool.value.length > 0 && pool.value.length < setup.value.length)
function begin() {
  start({
    direction: direction.value,
    scope: setup.value.scope,
    region: setup.value.region,
    length: setup.value.length,
    mode: setup.value.mode,
    difficulty: setup.value.difficulty ?? 'standard',
    mapPrompt: setup.value.mapPrompt ?? 'outline-capital',
    mapClick: setup.value.mapClick ?? 'borders',
  })
}
</script>

<template>
  <div>
    <header class="page-head">
      <p class="eyebrow">{{ t('common.planASession') }}</p>
      <h1 class="display">{{ t('setup.whereShallWe') }} <em>{{ t('setup.go') }}</em>?</h1>
      <p class="lede">{{ t('setup.fiveFieldsTwentyDirectionsPick') }}</p>
    </header>
    <div class="setup-grid">
      <div class="setup-form">
        <section class="card">
          <div class="card-head">
            <h2>{{ t('setup.direction') }}</h2>
            <span class="small muted num">{{ t('setup.directionsCount', { n: DIRECTIONS.length }) }}</span>
          </div>
          <div class="direction">
            <fieldset class="field-picker">
              <legend>{{ t('setup.iSee') }}</legend>
              <label v-for="f in FIELDS" :key="f" class="field-opt">
                <input type="radio" name="prompt" :value="f" :checked="setup.prompt === f" @change="pickPrompt(f)" />
                <span class="fo-ic"><Icon :name="`f_${f}`" /></span><span class="fo-text">{{ field(f, true) }}</span
                ><span class="fo-check"><Icon name="check" /></span>
              </label>
            </fieldset>
            <button type="button" class="swap" :aria-label="t('setup.swapQuestionAndAnswer')" @click="swap">
              <Icon name="swap" />
            </button>
            <fieldset class="field-picker">
              <legend>{{ t('setup.andAnswerWith') }}</legend>
              <label v-for="f in FIELDS" :key="f" class="field-opt" :class="{ 'is-disabled': f === setup.prompt }">
                <input v-model="setup.answer" type="radio" name="answer" :value="f" :disabled="f === setup.prompt" />
                <span class="fo-ic"><Icon :name="`f_${f}`" /></span><span class="fo-text">{{ field(f, true) }}</span
                ><span class="fo-check"><Icon name="check" /></span>
              </label>
            </fieldset>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>{{ t('common.region') }}</h2>
            <span class="small muted num">{{ t('common.countries', pool.length) }}</span>
          </div>
          <div class="chips" role="group" :aria-label="t('common.region')">
            <button
              v-for="r in regions"
              :key="r"
              type="button"
              class="chip"
              :aria-pressed="setup.region === r"
              @click="setup.region = r"
            >
              {{ regionName(r) }} <span class="chip-n">{{ poolSize(r) }}</span>
            </button>
          </div>
          <div class="scope-row">
            <div class="seg" role="group" :aria-label="t('common.scope')">
              <button type="button" :aria-pressed="setup.scope === 'un'" @click="setup.scope = 'un'">
                {{ t('common.unMembers') }}
              </button>
              <button type="button" :aria-pressed="setup.scope === 'all'" @click="setup.scope = 'all'">
                {{ t('setup.countriesTerritories') }}
              </button>
            </div>
          </div>
          <div class="region-map"><WorldMap :tint="Object.fromEntries(pool.map((c) => [c.id, 3]))" /></div>
          <p v-if="!pool.length" class="alert" role="alert">{{ t('setup.noCountryInThisSelection') }}</p>
          <p v-else-if="repeats" class="hint">{{ t('setup.fewerCountriesThanQuestionsSome') }}</p>
          <p v-else class="hint">{{ t('setup.smallRegionsBorrowDistractorsFrom') }}</p>
        </section>

        <div class="two-up">
          <section class="card">
            <h2>{{ t('setup.length') }}</h2>
            <div class="seg seg-lg" role="group" :aria-label="t('setup.sessionLength')">
              <button
                v-for="n in SESSION_LENGTHS"
                :key="n"
                type="button"
                :aria-pressed="!custom && setup.length === n"
                @click="setLength(n)"
              >
                <strong class="num">{{ n }}</strong><small>{{ t('common.questions') }}</small>
              </button>
              <button type="button" :aria-pressed="custom" @click="custom = true">
                <strong>…</strong><small>{{ t('setup.custom') }}</small>
              </button>
            </div>
            <label v-if="custom" class="custom-length"
              >{{ t('setup.numberOfQuestions') }}
              <input
                type="number"
                min="1"
                :max="MAX_SESSION_LENGTH"
                :value="setup.length"
                inputmode="numeric"
                @input="onCustom"
              />
            </label>
          </section>
          <section class="card">
            <h2>{{ t('setup.pace') }}</h2>
            <div class="seg seg-lg" role="group" :aria-label="t('setup.mode')">
              <button type="button" :aria-pressed="setup.mode === 'practice'" @click="setup.mode = 'practice'">
                <strong>{{ t('common.practice') }}</strong><small>{{ t('setup.retryFreely') }}</small>
              </button>
              <button type="button" :aria-pressed="setup.mode === 'challenge'" @click="setup.mode = 'challenge'">
                <strong>Challenge</strong
                ><small class="hearts" :aria-label="t('setup.threeLives')"
                  ><Icon name="heart" /><Icon name="heart" /><Icon name="heart"
                /></small>
              </button>
            </div>
          </section>
        </div>
        <section v-if="mapPrompt || mapClick" class="card map-style-card">
          <div class="card-head"><h2>{{ t('map.styleTitle') }}</h2></div>
          <template v-if="mapPrompt && sample">
            <p class="hint" style="margin: 0 0 12px">{{ t('map.promptStyleHint') }}</p>
            <div class="map-style-grid" role="group" :aria-label="t('map.styleTitle')">
              <button
                v-for="o in promptStyles"
                :key="o.k"
                type="button"
                class="map-style-opt"
                :aria-pressed="(setup.mapPrompt ?? 'outline-capital') === o.k"
                @click="setup.mapPrompt = o.k"
              >
                <span class="msp" aria-hidden="true"
                  ><MapPrompt :country="sample" :map-style="o.k" :zoomable="false"
                /></span>
                <strong>{{ t(o.label) }}</strong><small>{{ t(o.hint) }}</small>
              </button>
            </div>
          </template>
          <template v-if="mapClick">
            <p class="hint" style="margin: 0 0 12px">{{ t('map.clickStyleHint') }}</p>
            <div class="map-style-grid" role="group" :aria-label="t('map.styleTitle')">
              <button
                v-for="o in clickStyles"
                :key="o.k"
                type="button"
                class="map-style-opt"
                :aria-pressed="(setup.mapClick ?? 'borders') === o.k"
                @click="setup.mapClick = o.k"
              >
                <span class="msp" aria-hidden="true"
                  ><WorldMap
                    :silhouette="o.k === 'silhouette'"
                    :marks="o.k === 'borders' && sample ? { [sample.id]: 'miss' } : {}"
                /></span>
                <strong>{{ t(o.label) }}</strong><small>{{ t(o.hint) }}</small>
              </button>
            </div>
          </template>
        </section>
        <section class="card difficulty-card">
          <div class="card-head">
            <h2>{{ t('setup.difficulty') }}</h2>
            <span v-if="setup.difficulty === 'hard'" class="tag">{{
              flagDirection ? t('setup.similarFlags') : t('setup.neighbours')
            }}</span>
          </div>
          <div class="seg seg-lg" role="group" :aria-label="t('setup.difficulty')">
            <button
              type="button"
              :aria-pressed="(setup.difficulty ?? 'standard') === 'standard'"
              @click="setup.difficulty = 'standard'"
            >
              <strong>{{ t('setup.standard') }}</strong><small>{{ t('setup.mixedAnswerOptions') }}</small>
            </button>
            <button type="button" :aria-pressed="setup.difficulty === 'hard'" @click="setup.difficulty = 'hard'">
              <strong>{{ t('common.lookAlikes') }}</strong><small>{{ t('setup.similarFlagsNeighbours') }}</small>
            </button>
          </div>
          <p class="hint">
            {{
              setup.difficulty === 'hard'
                ? flagDirection
                  ? t('setup.wrongAnswersAreChosenFrom')
                  : t('setup.noFlagInThisDirection')
                : t('setup.wrongAnswersAreDrawnFrom')
            }}
          </p>
        </section>
      </div>

      <aside class="ticket" :aria-label="t('setup.sessionSummary')">
        <div class="ticket-top">
          <p class="eyebrow">{{ t('setup.yourTicket') }}</p>
          <div class="ticket-route">
            <div><small>{{ t('setup.from') }}</small><strong>{{ field(setup.prompt, true) }}</strong></div>
            <span class="ticket-plane" aria-hidden="true"><Icon name="arrow" /></span>
            <div class="right"><small>{{ t('setup.to') }}</small><strong>{{ field(setup.answer, true) }}</strong></div>
          </div>
          <dl class="ticket-meta">
            <div>
              <dt>{{ t('common.region') }}</dt>
              <dd>{{ regionName(setup.region) }}</dd>
            </div>
            <div>
              <dt>{{ t('setup.stops') }}</dt>
              <dd class="num">{{ String(setup.length).padStart(2, '0') }}</dd>
            </div>
            <div>
              <dt>{{ t('setup.mode') }}</dt>
              <dd>
                {{ setup.mode === 'practice' ? t('common.practice') : 'Challenge'
                }}{{ setup.difficulty === 'hard' ? ' · ' + t('setup.hard') : '' }}
              </dd>
            </div>
          </dl>
        </div>
        <div class="perf" aria-hidden="true" />
        <div class="ticket-bottom">
          <p class="eyebrow">{{ t('setup.preview') }}</p>
          <template v-if="preview">
            <div class="preview-q" aria-hidden="true">
              <FlagImg v-if="setup.prompt === 'flag'" :country="preview.target" mounted decorative />
              <span v-else-if="mapPrompt" class="pv-map"
                ><MapPrompt
                  :country="preview.target"
                  :map-style="setup.mapPrompt ?? 'outline-capital'"
                  :zoomable="false"
              /></span>
              <span v-else class="pv-text" :class="['tld', 'callingCode'].includes(setup.prompt) ? 'mono' : 'serif'">{{
                value(preview.target, setup.prompt)
              }}</span>
            </div>
            <p v-if="mapClick" class="pv-click"><Icon name="f_location" />{{ t('setup.previewClick') }}</p>
            <div v-else class="preview-opts" aria-hidden="true">
              <span v-for="(c, i) in preview.options" :key="c.id"
                ><kbd>{{ i + 1 }}</kbd><FlagImg v-if="setup.answer === 'flag'" :country="c" decorative /><em v-else>{{
                  value(c, setup.answer)
                }}</em></span
              >
            </div>
          </template>
          <button type="button" class="btn primary wide" :disabled="!pool.length" @click="begin">
            {{ t('setup.beginJourney') }}<Icon name="arrow" />
          </button>
          <p class="hint center">{{ t('setup.noAccountNeededPracticeStays') }}</p>
        </div>
      </aside>
    </div>
  </div>
</template>
