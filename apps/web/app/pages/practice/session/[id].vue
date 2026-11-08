<script setup lang="ts">
import {
  MAX_CLICK_TRIES,
  answer as applyAnswer,
  current,
  firstTryCorrect,
  isClickQuestion,
  isCorrectGuess,
  isLastStep,
  livesLeft,
  markAssisted,
  next as applyNext,
  parseDirection,
  questionDirection,
  reveal as applyReveal,
  sessionPool,
  type Session,
} from '@countrybox/domain'
definePageMeta({ focus: true })
const route = useRoute()
const { t, name, capital, value, field, region, coords } = useT()
const prefs = usePrefs()
const { byId, countries, ready } = useCatalog()
const { get, save } = useHistory()
const { announce } = useFeedback()

const s = shallowRef<Session | null>(null)
const missing = ref(false)
const titleEl = ref<HTMLElement | null>(null)
const nextEl = ref<HTMLElement | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined
const timing = ref(false)

onMounted(async () => {
  await ready()
  const found = await get(String(route.params.id))
  if (!found || found.status === 'finished') {
    if (found) return navigateTo(`/results/${found.id}`, { replace: true })
    missing.value = true
    return
  }
  await commit(withHint(found))
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  window.removeEventListener('keydown', onKey)
})
onMounted(() => window.addEventListener('keydown', onKey))

// Each question carries its own direction (country drills mix them).
const pair = computed(() =>
  s.value && q.value ? parseDirection(questionDirection(s.value, q.value))! : (['flag', 'name'] as const),
)
const mixed = computed(() => (s.value?.config.directions?.length ?? 0) > 1)
const q = computed(() => (s.value ? current(s.value) : null))
const target = computed(() => (q.value ? (byId.value.get(q.value.targetId) ?? null) : null))
const options = computed(() => (q.value ? q.value.optionIds.map((id) => byId.value.get(id)!).filter(Boolean) : []))
const resolved = computed(() => q.value?.resolved ?? false)
const correctFirst = computed(() => !!q.value && firstTryCorrect(q.value))
const click = computed(() => !!q.value && isClickQuestion(q.value))
const mapPromptStyle = computed(() => s.value?.config.mapPrompt ?? 'outline-capital')
const mapClickStyle = computed(() => s.value?.config.mapClick ?? 'borders')
const clickTriesLeft = computed(() => (q.value ? Math.max(0, MAX_CLICK_TRIES - q.value.guesses.length) : 0))
/** Initial click-map view: the session's region (whole world when the session spans it). */
const clickFocus = computed(() =>
  s.value && s.value.config.region !== 'world'
    ? sessionPool(countries.value, { ...s.value.config, targetIds: undefined }).map((c) => c.id)
    : [],
)
const lastGuess = computed(() =>
  q.value?.guesses.length ? (byId.value.get(q.value.guesses[q.value.guesses.length - 1]!) ?? null) : null,
)
const lives = computed(() => (s.value ? livesLeft(s.value) : null))
/** Questions about the location itself never get a pre-answer map hint (it would give the answer away). */
const locationQuestion = computed(() => pair.value[0] === 'location' || pair.value[1] === 'location')
const showMap = computed(
  () => (prefs.value.map === 'always' && !locationQuestion.value) || (prefs.value.map !== 'off' && resolved.value),
)
const wrongTries = computed(() => (q.value ? q.value.guesses.filter((g) => !isCorrectGuess(q.value!, g)).length : 0))

function withHint(x: Session) {
  const d = x.questions[x.index] ? questionDirection(x, x.questions[x.index]!) : x.config.direction
  return prefs.value.map === 'always' && !d.includes('location') ? markAssisted(x) : x
}
async function commit(x: Session) {
  s.value = x
  await save(x)
}

const title = computed(() =>
  pair.value[1] === 'location'
    ? t('session.clickTheCountry')
    : pair.value[0] === 'location' && pair.value[1] === 'name'
      ? mapPromptStyle.value === 'capital'
        ? t('session.whichCapitalIsThis')
        : t('session.whereIsThisCountry')
      : {
          name: t('common.whichCountryIsThis'),
          capital: t('common.whatIsTheCapital'),
          flag: t('common.whichFlagBelongsHere'),
          tld: t('common.whichDomainBelongsHere'),
          callingCode: t('common.whichCallingCodeFits'),
        }[pair.value[1]],
)

function optionState(id: string) {
  const qq = q.value!
  if (qq.resolved) return id === qq.targetId ? 'correct' : qq.guesses.includes(id) ? 'wrong' : 'dim'
  return qq.guesses.includes(id) ? 'wrong tried' : ''
}

async function choose(id: string) {
  if (!s.value || resolved.value) return
  const before = s.value
  const after = applyAnswer(before, id)
  if (after === before) return
  await commit(after)
  const nq = current(after)
  if (isCorrectGuess(nq, id)) announce(t('common.correct'))
  else if (nq.resolved) announce(t('common.incorrectTheAnswerIs', { answer: value(target.value!, pair.value[1]) }))
  else if (isClickQuestion(nq)) announce(t('session.clickTriesLeft', MAX_CLICK_TRIES - nq.guesses.length))
  else announce(t('session.notThisOneTryAgain'))
  if (nq.resolved) afterResolve()
}
async function reveal() {
  if (!s.value) return
  await commit(applyReveal(s.value))
  announce(t('session.theAnswerIs', { answer: value(target.value!, pair.value[1]) }))
  afterResolve()
}
function afterResolve() {
  nextTick(() => {
    nextEl.value?.focus({ preventScroll: true })
    nextEl.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
  if (prefs.value.auto) {
    timing.value = true
    timer = setTimeout(goNext, 4000)
  }
}
function pauseAuto() {
  clearTimeout(timer)
  timing.value = false
  nextEl.value?.focus()
}
async function goNext() {
  clearTimeout(timer)
  timing.value = false
  if (!s.value || !resolved.value) return
  const after = applyNext(s.value, new Date())
  if (after.status === 'finished') {
    await save(after)
    return navigateTo(`/results/${after.id}`)
  }
  await commit(withHint(after))
  nextTick(() => titleEl.value?.focus({ preventScroll: true }))
}
function onKey(e: KeyboardEvent) {
  const tag = (document.activeElement?.tagName ?? '').toUpperCase()
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag) || e.metaKey || e.ctrlKey || e.altKey) return
  if (/^[1-4]$/.test(e.key) && q.value && !resolved.value) {
    const id = q.value.optionIds[Number(e.key) - 1]
    if (id) {
      e.preventDefault()
      void choose(id)
    }
  } else if (e.key === 'Enter' && resolved.value && tag !== 'BUTTON' && tag !== 'A') {
    e.preventDefault()
    void goNext()
  }
}
const stops = computed(
  () =>
    s.value?.questions.map((x, i) =>
      x.resolved ? (firstTryCorrect(x) ? 'ok' : 'miss') : i === s.value!.index ? 'cur' : '',
    ) ?? [],
)
const pad = (n: number) => String(n).padStart(2, '0')
</script>

<template>
  <div v-if="missing" class="empty card">
    <h1 class="display sm">{{ t('session.thisSessionIsNotOn') }}</h1>
    <p class="muted">{{ t('session.guestSessionsAreStoredLocally') }}</p>
    <NuxtLink to="/practice" class="btn primary">{{ t('common.planASession') }}</NuxtLink>
  </div>
  <div v-else-if="s && q && target" class="session">
    <div class="session-bar">
      <NuxtLink to="/practice" class="icon-btn" :aria-label="t('session.leaveSession')"><Icon name="x" /></NuxtLink>
      <ol class="stops" aria-hidden="true">
        <li v-for="(st, i) in stops" :key="i" :class="st">
          <Icon v-if="st === 'ok'" name="check" /><Icon v-else-if="st === 'miss'" name="x" />
        </li>
      </ol>
      <div class="session-meta">
        <span v-if="lives !== null" class="lives" role="img" :aria-label="`${lives} ${t('session.livesLeft')}`"
          ><span v-for="i in 3" :key="i" :class="{ lost: i > lives }"><Icon name="heart" /></span
        ></span>
        <span v-else class="mode-pill"
          >{{ mixed ? t('session.drillMixedDirections') : t('common.practice')
          }}{{ s.config.difficulty === 'hard' ? ' · ' + t('session.lookAlikes') : '' }}</span
        >
        <span class="counter num"
          >{{ pad(s.index + 1) }}<span class="muted">/{{ pad(s.questions.length) }}</span
          ><span class="sr-only"> {{ t('common.questions') }}</span></span
        >
      </div>
    </div>

    <div class="session-grid">
      <section class="question card" :class="{ 'is-click': click }" aria-labelledby="question-title">
        <p class="eyebrow">{{ field(pair[0], true) }} → {{ field(pair[1], true) }}</p>
        <h1 id="question-title" ref="titleEl" class="q-title" tabindex="-1">{{ title }}</h1>
        <MapPrompt
          v-if="pair[0] === 'location'"
          :key="target.id + mapPromptStyle"
          :country="target"
          :map-style="mapPromptStyle"
        />
        <div v-else-if="pair[0] === 'flag'" class="prompt-flag">
          <FlagImg :key="target.id" :country="target" mounted :anonymous="!resolved" eager />
        </div>
        <div v-else class="prompt-text" :class="['tld', 'callingCode'].includes(pair[0]) ? 'mono' : 'serif'">
          {{ value(target, pair[0]) }}
        </div>
        <template v-if="click">
          <ClickMap
            :key="q.targetId + s.index"
            :mode="mapClickStyle"
            :resolved="resolved"
            :correct-ids="q.acceptIds ?? [q.targetId]"
            :guesses="q.guesses"
            :focus-ids="clickFocus"
            @pick="choose"
          />
          <p v-if="!resolved && !wrongTries" class="click-hint">
            {{ t('session.clickHint') }} ·
            <button type="button" class="text-link inline-link" @click="reveal">{{ t('session.showMeWhere') }}</button>
          </p>
        </template>
        <div v-else class="answers" :class="{ 'flag-answers': pair[1] === 'flag' }">
          <button
            v-for="(c, i) in options"
            :key="c.id"
            type="button"
            class="answer"
            :class="[optionState(c.id), { 'is-flag': pair[1] === 'flag' }]"
            :aria-disabled="resolved || q.guesses.includes(c.id) ? 'true' : undefined"
            @click="choose(c.id)"
          >
            <kbd aria-hidden="true">{{ i + 1 }}</kbd>
            <span class="answer-val"
              ><FlagImg v-if="pair[1] === 'flag'" :country="c" :anonymous="!resolved" /><template v-else>{{
                value(c, pair[1])
              }}</template></span
            >
            <span v-if="resolved && c.id === q.targetId" class="mark ok"
              ><Icon name="check" /><span class="sr-only">{{ t('common.correctAnswer') }}</span></span
            >
            <span v-else-if="q.guesses.includes(c.id)" class="mark no"
              ><Icon name="x" /><span class="sr-only">{{ t('common.yourAnswerIncorrect') }}</span></span
            >
          </button>
        </div>
        <div v-if="!resolved && wrongTries" class="retry-row">
          <span v-if="click"
            >{{
              lastGuess && mapClickStyle === 'borders' ? t('session.youClicked', { name: name(lastGuess) }) + ' ' : ''
            }}{{ t('session.clickTriesLeft', clickTriesLeft) }}</span
          >
          <span v-else>{{ t('session.notQuiteTryAgain') }}</span>
          <button type="button" class="text-link" @click="reveal">
            <Icon name="eye" />{{ t('session.showAnswer') }}
          </button>
        </div>
        <p v-else-if="!resolved && !click" class="keyhint">
          <kbd>1</kbd>–<kbd>4</kbd> {{ t('session.toAnswerTakeYourTime') }}
        </p>
      </section>

      <aside
        class="notes card"
        :class="resolved ? (correctFirst ? 'is-ok' : 'is-miss') : prefs.map === 'always' ? '' : 'is-pending'"
      >
        <div v-if="resolved" class="verdict">
          <Icon :name="correctFirst ? 'check' : 'x'" />
          <div>
            <strong>{{
              correctFirst
                ? t('session.spotOn')
                : q.revealed
                  ? t('session.nowYouKnow')
                  : t('session.notQuiteNowYouKnow')
            }}</strong>
            <small>{{
              correctFirst
                ? t('session.aNewConnectionMade')
                : t('session.theAnswerIs2', {
                    answer: pair[1] === 'flag' ? t('session.theMarkedFlag') : value(target, pair[1]),
                  })
            }}</small>
          </div>
        </div>
        <template v-else>
          <p class="eyebrow">{{ t('common.fieldNotes') }}</p>
          <p class="muted">{{ t('session.lookForTheOneDetail') }}</p>
        </template>

        <div v-if="showMap && target.map" class="notes-map">
          <WorldMap
            :focus="target.id"
            :highlight="target.id"
            :pins="[target]"
            :label="resolved ? t('common.locationOf', { name: name(target) }) : t('session.locationHint')"
          />
          <span v-if="!resolved" class="map-flag">{{ t('common.hint') }}</span>
        </div>
        <div
          v-else-if="prefs.map === 'after' && !resolved && !locationQuestion"
          class="notes-map is-veiled"
          aria-hidden="true"
        >
          <WorldMap /><span class="veil"><Icon name="map" />{{ t('session.mapAppearsAfterYouAnswer') }}</span>
        </div>

        <template v-if="resolved">
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
          <button ref="nextEl" type="button" class="btn primary wide" :class="{ 'is-timed': timing }" @click="goNext">
            {{ isLastStep(s) ? t('session.seeResults') : t('session.nextStop') }}<Icon name="arrow" />
          </button>
          <button v-if="timing" type="button" class="text-link center-link" @click="pauseAuto">
            {{ t('session.autoContinueIn4S') }}
          </button>
          <p v-else class="hint center"><kbd>Enter</kbd> {{ t('common.toContinue') }}</p>
        </template>
      </aside>
    </div>
  </div>
</template>
