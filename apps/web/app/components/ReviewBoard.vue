<script setup lang="ts">
import { parseDirection, stageIntervalDays } from '@countrybox/domain'
const { t, name, field, dateLocale } = useT()
const { byId } = useCatalog()
const { queue, load, remove } = useReviews()
const box = ref(0)
onMounted(load)
const cards = computed(() => queue.value?.cards ?? [])
const due = computed(() =>
  (queue.value?.due ?? []).map((c) => ({ ...c, country: byId.value.get(c.entityId) })).filter((c) => c.country),
)
const inBox = computed(() =>
  cards.value
    .filter((c) => c.stage === box.value)
    .map((c) => ({ ...c, country: byId.value.get(c.entityId)! }))
    .filter((c) => c.country),
)
const upcoming = computed(() => queue.value?.upcoming ?? [])
const maxUp = computed(() => Math.max(1, ...upcoming.value))
const dirLabel = (d: string) => {
  const p = parseDirection(d)
  return p ? `${field(p[0])} → ${field(p[1])}` : d
}
const dueLabel = (iso: string) => {
  const ms = Date.parse(iso) - Date.now()
  if (ms <= 0) return t('reviews.dueNow')
  if (ms < 3600_000) return t('reviews.inMin', { n: Math.ceil(ms / 60000) })
  const d = Math.ceil(ms / 86_400_000)
  return t('reviews.inDays', Math.max(1, d))
}
const dayName = (i: number) => {
  if (i === 0) return t('common.today')
  const d = new Date(Date.now() + i * 86_400_000)
  return d.toLocaleDateString(dateLocale.value, { weekday: 'short' })
}
</script>

<template>
  <div v-if="!queue" class="board-skeleton" aria-busy="true" :aria-label="t('reviews.loadingYourBox')">
    <section class="due-banner is-loading" aria-hidden="true">
      <div class="db-copy">
        <span class="skeleton-line" style="width: 72px; height: 12px; margin-bottom: 8px" />
        <span class="skeleton-line" style="width: 200px; height: 28px; margin-bottom: 12px" />
        <span class="skeleton-line" style="width: 280px; height: 14px" />
      </div>
    </section>
    <section class="box-section" aria-hidden="true">
      <div class="section-head">
        <h2>{{ t('reviews.yourBox') }}</h2>
      </div>
      <div class="the-box">
        <div v-for="s in 6" :key="s" class="compartment skeleton-compartment">
          <div class="cmp-label">
            <span class="skeleton-line" style="width: 28px; height: 10px" />
            <span class="skeleton-line" style="width: 44px; height: 30px; margin: 6px 0" />
            <span class="skeleton-line" style="width: 56px; height: 10px" />
          </div>
        </div>
      </div>
    </section>
  </div>
  <div v-else>
    <section class="due-banner">
      <div class="db-flags" aria-hidden="true">
        <span v-for="(c, i) in due.slice(0, 5)" :key="c.id" :style="{ '--i': i }"
          ><FlagImg :country="c.country!" mounted decorative
        /></span>
      </div>
      <div class="db-copy">
        <p class="eyebrow">{{ due.length ? t('reviews.readyNow') : t('reviews.allCaughtUp') }}</p>
        <h2 class="serif">
          {{
            due.length
              ? t('reviews.cardsDue', due.length)
              : cards.length
                ? t('reviews.nothingDueRightNow')
                : t('reviews.yourBoxIsEmpty')
          }}
        </h2>
        <p>{{ cards.length ? t('reviews.reviewsAreTheOnlySessions') : t('reviews.openACountryInThe') }}</p>
      </div>
      <NuxtLink v-if="due.length" to="/reviews/session" class="btn primary on-dark"
        >{{ t('reviews.startReview') }}<Icon name="arrow"
      /></NuxtLink>
      <NuxtLink v-else to="/explore" class="btn primary on-dark"
        >{{ t('reviews.openTheAtlas') }}<Icon name="arrow"
      /></NuxtLink>
    </section>

    <section class="box-section" aria-labelledby="box-title">
      <div class="section-head">
        <h2 id="box-title">{{ t('reviews.yourBox') }}</h2>
      </div>
      <div class="the-box" role="group" :aria-label="t('reviews.compartments')">
        <button
          v-for="s in 6"
          :key="s"
          type="button"
          class="compartment"
          :data-box="s - 1"
          :aria-pressed="box === s - 1"
          @click="box = s - 1"
        >
          <span class="cards" aria-hidden="true"
            ><i
              v-for="i in Math.min(cards.filter((c) => c.stage === s - 1).length, 5)"
              :key="i"
              :style="{ '--i': i - 1 }"
          /></span>
          <span class="cmp-label">
            <span class="mono">{{ s === 1 ? t('reviews.new') : 'S' + (s - 1) }}</span>
            <strong class="num">{{ cards.filter((c) => c.stage === s - 1).length }}</strong>
            <small>{{
              s === 1 ? t('reviews.againSoon') : t('reviews.everyDays', stageIntervalDays(s - 1) ?? 1)
            }}</small>
          </span>
        </button>
      </div>
      <div class="card box-list">
        <div class="card-head">
          <h3>{{ box === 0 ? t('reviews.newRelearning') : t('reviews.compartment', { box }) }}</h3>
          <span class="mono small muted">{{ t('common.cards', inBox.length) }}</span>
        </div>
        <ul v-if="inBox.length" class="rows">
          <li v-for="c in inBox" :key="c.id" class="row-line">
            <NuxtLink :to="`/explore/${c.entityId}`" class="row-btn"
              ><span class="mini-flag"><FlagImg :country="c.country" decorative /></span
              ><span class="rb-main"
                ><strong>{{ name(c.country) }}</strong
                ><small
                  >{{ dirLabel(c.direction) }}{{ c.lapses ? ' · ' + t('reviews.lapses', c.lapses) : '' }}</small
                ></span
              ><span class="due" :class="{ now: Date.parse(c.dueAt) <= Date.now() }">{{
                dueLabel(c.dueAt)
              }}</span></NuxtLink
            >
            <button
              type="button"
              class="icon-btn"
              :aria-label="t('reviews.removeFromBox', { name: name(c.country) })"
              @click="remove(c.id)"
            >
              <Icon name="x" />
            </button>
          </li>
        </ul>
        <p v-else class="muted">{{ t('reviews.emptyCompartment') }}</p>
      </div>
    </section>

    <section class="card week" aria-labelledby="week-title">
      <div class="card-head"><h2 id="week-title">{{ t('reviews.theWeekAhead') }}</h2></div>
      <ol class="bars">
        <li v-for="(n, i) in upcoming" :key="i" :class="{ today: i === 0 }">
          <span class="bar-n num">{{ n }}</span
          ><span class="bar" :style="{ '--h': ((n / maxUp) * 100).toFixed(0) + '%' }" /><span class="bar-d">{{
            dayName(i)
          }}</span>
        </li>
      </ol>
    </section>
  </div>
</template>
