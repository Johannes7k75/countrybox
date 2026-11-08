<script setup lang="ts">
const { t, languages } = useT()
const prefs = usePrefs()
const { clear, finished } = useHistory()
const { toast } = useFeedback()
const seg = <K extends 'locale' | 'theme' | 'map'>(key: K, options: [string, string][]) => ({ key, options })
const groups = computed(() => [
  {
    title: t('common.language'),
    hint: t('settings.interfaceAndCountryNames'),
    ...seg(
      'locale',
      languages.value.map((l) => [l.code, l.name] as [string, string]),
    ),
  },
  {
    title: t('settings.appearance'),
    hint: t('settings.paperByDayInkBy'),
    ...seg('theme', [
      ['system', t('settings.system')],
      ['light', t('settings.light')],
      ['dark', t('settings.dark')],
    ]),
  },
  {
    title: t('settings.mapContext'),
    hint: t('settings.alwaysShowsTheLocationBefore'),
    ...seg('map', [
      ['after', t('settings.afterAnswer')],
      ['always', t('settings.always')],
      ['off', t('settings.off')],
    ]),
  },
])
function set(key: 'locale' | 'theme' | 'map', v: string) {
  ;(prefs.value as unknown as Record<string, string>)[key] = v
}
async function wipe() {
  if (!confirm(t('settings.deleteAllPracticeHistoryStored'))) return
  await clear()
  toast(t('settings.localHistoryDeleted'))
}
</script>
<template>
  <div>
    <header class="page-head">
      <h1 class="display">{{ t('settings.makeYourself') }} <em>{{ t('settings.atHome') }}</em>.</h1>
    </header>
    <div class="settings-grid">
      <section class="card prefs" :aria-label="t('settings.preferences')">
        <div v-for="g in groups" :key="g.key" class="pref">
          <div>
            <strong>{{ g.title }}</strong>
            <p>{{ g.hint }}</p>
          </div>
          <div class="seg" role="group" :aria-label="g.title">
            <button
              v-for="[v, l] in g.options"
              :key="v"
              type="button"
              :aria-pressed="prefs[g.key] === v"
              @click="set(g.key, v)"
            >
              {{ l }}
            </button>
          </div>
        </div>
        <div class="pref">
          <label for="auto"
            ><strong>{{ t('settings.continueAutomatically') }}</strong>
            <p>{{ t('settings.moveOn4SecondsAfter') }}</p></label
          ><input id="auto" v-model="prefs.auto" type="checkbox" class="switch" />
        </div>
        <div class="pref">
          <label for="motion"
            ><strong>{{ t('settings.reduceMotion') }}</strong>
            <p>{{ t('settings.yourDeviceSettingIsAlways') }}</p></label
          ><input id="motion" v-model="prefs.motion" type="checkbox" class="switch" />
        </div>
        <div class="pref-foot">
          <p class="hint">{{ t('settings.preferencesAndPracticeSessionsAre', finished.length) }}</p>
          <button type="button" class="btn ghost" @click="wipe">{{ t('settings.deleteLocalHistory') }}</button>
        </div>
      </section>
      <AccountPanel />
    </div>
  </div>
</template>
