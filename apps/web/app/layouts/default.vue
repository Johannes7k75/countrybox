<script setup lang="ts">
import type { IconName } from '~/utils/icons'
const route = useRoute()
const { t, languages, name: countryName } = useT()
const { byId } = useCatalog()
const prefs = usePrefs()
const dark = useDark()
const { user } = useAccount()
const dueCount = useState<number>('due-count', () => 0)

const items = computed<{ to: string; icon: IconName; label: string; badge?: number }[]>(() => [
  { to: '/', icon: 'home', label: t('common.today') },
  { to: '/practice', icon: 'practice', label: t('common.practice') },
  { to: '/explore', icon: 'explore', label: t('nav.atlas') },
  { to: '/reviews', icon: 'reviews', label: t('nav.reviews'), badge: dueCount.value },
  { to: '/account', icon: 'settings', label: t('nav.settings') },
])
const section = (path: string) => '/' + (path.split('/')[1] === 'results' ? 'practice' : (path.split('/')[1] ?? ''))
const active = computed(() => items.value.find((i) => i.to === section(route.path)) ?? items.value[0]!)
const focus = computed(() => route.meta.focus === true)

const subpageCrumb = computed(() => {
  if (['/', '/practice', '/explore', '/reviews', '/account'].includes(route.path)) return null
  if (route.path.startsWith('/explore/')) {
    const id = String(route.params.id ?? '')
    const c = id ? byId.value.get(id) : null
    return { parent: { to: '/explore', label: t('nav.atlas') }, current: c ? countryName(c) : id }
  }
  if (route.path.startsWith('/results/')) {
    return { parent: { to: '/practice', label: t('common.practice') }, current: t('results.journeyComplete') }
  }
  if (route.path.startsWith('/practice/')) {
    return { parent: { to: '/practice', label: t('common.practice') }, current: t('common.practice') }
  }
  if (route.path.startsWith('/reviews/')) {
    return { parent: { to: '/reviews', label: t('nav.reviews') }, current: t('nav.reviews') }
  }
  return null
})

const toggleTheme = () => {
  prefs.value.theme = dark.value ? 'light' : 'dark'
}
</script>

<template>
  <div class="shell" :class="{ 'is-focus': focus }">
    <aside class="sidebar">
      <NuxtLink to="/" class="brand"
        ><BrandMark /><span>country<b>box</b></span></NuxtLink
      >
      <p class="edition">{{ t('nav.aFieldAtlas') }}</p>
      <nav class="nav" :aria-label="t('nav.mainNavigation')">
        <NuxtLink
          v-for="i in items"
          :key="i.to"
          :to="i.to"
          :class="{ active: active.to === i.to }"
          :aria-current="active.to === i.to ? 'page' : undefined"
        >
          <Icon :name="i.icon" /><span>{{ i.label }}</span>
          <b v-if="i.badge" class="count">{{ i.badge }}<span class="sr-only"> {{ t('nav.due') }}</span></b>
        </NuxtLink>
      </nav>
      <div class="side-foot">
        <NuxtLink class="passport-mini" to="/account">
          <span class="pp-cover" aria-hidden="true"><BrandMark /></span>
          <span>
            <strong>{{ user ? user.name : t('common.guestExplorer') }}</strong>
            <small>{{ user ? (user.username ?? user.email) : t('nav.learningOnThisDevice') }}</small>
          </span>
        </NuxtLink>
      </div>
    </aside>
    <div class="workspace">
      <header class="topbar">
        <NuxtLink to="/" class="brand mobile-only"
          ><BrandMark /><span>country<b>box</b></span></NuxtLink
        >
        <nav v-if="subpageCrumb" class="crumb" aria-label="Breadcrumb">
          <NuxtLink :to="subpageCrumb.parent.to" class="crumb-parent">{{ subpageCrumb.parent.label }}</NuxtLink>
          <span class="sep" aria-hidden="true" />
          <strong class="crumb-current">{{ subpageCrumb.current }}</strong>
        </nav>
        <div class="top-actions">
          <button type="button" class="icon-btn" :aria-label="t('nav.toggleDarkTheme')" @click="toggleTheme">
            <Icon :name="dark ? 'sun' : 'moon'" />
          </button>
          <div class="seg seg-sm" role="group" :aria-label="t('common.language')">
            <button
              v-for="l in languages"
              :key="l.code"
              type="button"
              :aria-pressed="prefs.locale === l.code"
              :aria-label="l.name"
              @click="prefs.locale = l.code"
            >
              {{ l.code.toUpperCase() }}
            </button>
          </div>
        </div>
      </header>
      <main id="main" class="main" :class="`view-${String(route.name ?? '')}`" tabindex="-1">
        <slot />
      </main>
      <footer v-if="!focus" class="footer">
        <span>COUNTRYBOX · {{ t('nav.aLittleMoreOfThe') }}</span>
        <a href="/catalog/NOTICE.txt">{{ t('nav.dataFlagCredits') }}</a>
      </footer>
    </div>
    <nav class="tabbar" :aria-label="t('nav.mainNavigation')">
      <NuxtLink
        v-for="i in items"
        :key="i.to"
        :to="i.to"
        :class="{ active: active.to === i.to }"
        :aria-current="active.to === i.to ? 'page' : undefined"
      >
        <Icon :name="i.icon" /><span>{{ i.label }}</span><b v-if="i.badge" class="count">{{ i.badge }}</b>
      </NuxtLink>
    </nav>
  </div>
</template>
