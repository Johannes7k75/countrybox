<script setup lang="ts">
const { t } = useT()
const { user, refresh, signOut } = useAccount()
const { toast, announce } = useFeedback()
const { pending, busy: importing, run: runImport } = useImport()

type Mode = 'create' | 'signin'
const mode = ref<Mode>('create')
const kind = ref<'id' | 'email'>('id')
const form = reactive({ name: '', email: '', id: '', password: '', password2: '', remember: true })
const errors = ref<Record<string, string>>({})
const busy = ref(false)
/** Shown once after a no-email signup; the learner must confirm they saved it. */
const newId = ref<string | null>(null)
const savedAck = ref(false)
const reauth = ref(false)
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

function reset() {
  errors.value = {}
  form.password = ''
  form.password2 = ''
}

/* Create/sign-in live in a modal so the settings page stays balanced. */
const dlg = ref<HTMLDialogElement | null>(null)
function openAuth(m: Mode) {
  mode.value = m
  reset()
  dlg.value?.showModal()
}
function closeAuth() {
  dlg.value?.close()
}
/** While the new ID is on screen, Escape must not dismiss it before the learner confirms they saved it. */
function onCancel(e: Event) {
  if (newId.value) e.preventDefault()
}
watch([mode, kind], reset)

async function create() {
  errors.value = {}
  if (form.password.length < 10) errors.value.password = t('account.useAtLeast10Characters')
  if (form.password !== form.password2) errors.value.password2 = t('account.passwordsDoNotMatch')
  if (kind.value === 'email' && !/^\S+@\S+\.\S+$/.test(form.email))
    errors.value.email = t('account.enterAValidEmailAddress')
  if (Object.keys(errors.value).length) return
  busy.value = true
  try {
    const api = useApi().api.accounts
    if (kind.value === 'id') {
      const res = await api.pseudonymous.$post({
        json: {
          password: form.password,
          ...(form.name.trim() ? { name: form.name.trim() } : {}),
          rememberMe: form.remember,
        },
      })
      if (res.status === 201) {
        newId.value = (await res.json()).accountId
        savedAck.value = false
        announce(t('account.accountCreatedSaveYourAccount'))
      } else if ((res.status as number) === 429)
        errors.value.form /* middleware status, not inferred by RPC */ = t('account.tooManyAttemptsTryAgain')
      else errors.value.form = t('account.couldNotCreateTheAccount')
    } else {
      const res = await api.email.$post({
        json: { email: form.email.trim(), password: form.password, name: form.name.trim() || 'Explorer' },
      })
      if (res.status === 201) {
        await refresh()
        closeAuth()
        toast(t('account.welcomeAboard'))
      } else errors.value.form = t('account.couldNotCreateAnAccount')
    }
  } catch {
    errors.value.form = t('account.networkErrorCheckYourConnection')
  } finally {
    busy.value = false
  }
}
async function finishCreate() {
  newId.value = null
  closeAuth()
  await refresh()
}
async function copyId() {
  try {
    await navigator.clipboard.writeText(newId.value ?? '')
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
    toast(t('account.copied'))
  } catch {
    /* clipboard unavailable */
  }
}
function downloadId() {
  const blob = new Blob([`CountryBox account ID: ${newId.value}\nSign in at ${location.origin}/account\n`], {
    type: 'text/plain',
  })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'countrybox-account-id.txt'
  a.click()
  URL.revokeObjectURL(a.href)
}

async function signIn() {
  errors.value = {}
  busy.value = true
  try {
    const auth = useAuthClient()
    const res =
      kind.value === 'id'
        ? await auth.signIn.username({
            username: normalizeAccountId(form.id),
            password: form.password,
            rememberMe: form.remember,
          })
        : await auth.signIn.email({ email: form.email.trim(), password: form.password, rememberMe: form.remember })
    if (res.error) {
      errors.value.form =
        res.error.status === 429 ? t('account.tooManyAttemptsTryAgain') : t('account.thatIdEmailAndPassword')
      return
    }
    reauth.value = false
    await refresh()
    closeAuth()
    toast(t('account.signedIn'))
  } catch {
    errors.value.form = t('account.networkErrorCheckYourConnection')
  } finally {
    busy.value = false
  }
}

async function doImport() {
  try {
    const n = await runImport()
    toast(t('account.sessionsImportedAsPracticeHistory', n))
  } catch {
    toast(t('account.importFailedNothingWasLost'))
  }
}
async function needReauth() {
  reauth.value = true
  await signOut()
  openAuth('signin')
  toast(t('account.forYourSafetyPleaseSign'))
}
async function exportData() {
  const res = await useApi().api.account.export.$post()
  if (res.status === 403) return needReauth()
  if (res.status !== 200) return toast(t('account.exportFailed'))
  const blob = new Blob([JSON.stringify(await res.json(), null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'countrybox-export.json'
  a.click()
  URL.revokeObjectURL(a.href)
}
async function deleteAccount() {
  if (!confirm(t('account.deleteYourAccountAndAll'))) return
  const res = await useApi().api.account.$delete()
  if (res.status === 403) return needReauth()
  if (res.status === 200) {
    await signOut()
    toast(t('account.accountDeleted'))
  }
}
async function doSignOut() {
  await signOut()
  toast(t('account.signedOut'))
}
</script>

<template>
  <aside class="passport-col">
    <div class="passport" :class="{ 'is-open': !!user }" aria-hidden="true">
      <div class="pp-head"><span class="mono">{{ t('account.passport') }} · COUNTRYBOX</span><BrandMark /></div>
      <div class="pp-emblem pp-map"><WorldMap /></div>
      <div class="pp-body">
        <p class="pp-k">{{ t('account.holder') }}</p>
        <p class="pp-v serif">{{ user?.name ?? t('common.guestExplorer') }}</p>
        <p class="pp-k">{{ user?.emailIsReal ? 'Email' : t('account.accountId') }}</p>
        <p class="pp-v mono">{{ user ? (user.username ?? user.email) : '— — — —' }}</p>
        <p class="pp-k">{{ t('account.status') }}</p>
        <p class="pp-v">{{ user ? t('account.synced') : t('account.thisDeviceOnly') }}</p>
      </div>
      <div class="pp-mrz mono">
        P&lt;CBX&lt;&lt;{{
          (user?.name ?? 'GUEST').toUpperCase().replace(/\s+/g, '&lt;')
        }}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
      </div>
    </div>

    <section v-if="user" class="card account" aria-labelledby="acct-title">
      <h2 id="acct-title">{{ t('account.yourAccount') }}</h2>
      <p class="muted">
        {{ user.emailIsReal ? t('account.signedInWithEmailAddress') : t('account.signedInWithYourAccount') }}
      </p>
      <div v-if="pending.length" class="id-box" style="display: grid; gap: 12px">
        <span>{{ t('account.importThisDeviceSPractice', pending.length) }}</span>
        <button type="button" class="btn primary" :disabled="importing" @click="doImport">
          {{ t('account.importHistory') }}
        </button>
      </div>
      <button type="button" class="btn secondary wide" @click="doSignOut">
        <Icon name="logout" />{{ t('account.signOut') }}
      </button>
      <div class="danger-zone">
        <button type="button" class="btn ghost wide" @click="exportData">{{ t('account.exportMyDataJson') }}</button>
        <button type="button" class="btn danger wide" @click="deleteAccount">{{ t('account.deleteAccount') }}</button>
        <p class="hint">{{ t('account.exportAndDeletionNeedA') }}</p>
      </div>
    </section>

    <section v-else class="card account" aria-labelledby="auth-title">
      <h2 id="auth-title">{{ t('account.yourAtlasEverywhere') }}</h2>
      <p class="muted">{{ t('account.anOptionalAccountSyncsSettings') }}</p>
      <div class="account-actions">
        <button type="button" class="btn primary" @click="openAuth('create')">{{ t('account.createAccount') }}</button>
        <button type="button" class="btn secondary" @click="openAuth('signin')">{{ t('account.signIn') }}</button>
      </div>
    </section>
    <dialog ref="dlg" class="auth-dialog" aria-labelledby="auth-dialog-title" @cancel="onCancel">
      <button
        v-if="!newId"
        type="button"
        class="icon-btn auth-close"
        :aria-label="t('account.close')"
        @click="closeAuth"
      >
        <Icon name="x" />
      </button>
      <div v-if="newId" class="auth-body">
        <h2 id="auth-dialog-title" class="serif auth-title">{{ t('account.saveYourAccountId') }}</h2>
        <p class="muted">{{ t('account.thisIdAndYourPassword') }}</p>
        <div class="id-box"><code>{{ newId }}</code></div>
        <div class="row">
          <button type="button" class="btn secondary" @click="copyId">
            <Icon :name="copied ? 'check' : 'copy'" />
            <span>{{ copied ? t('account.copied') : t('account.copy') }}</span></button
          ><button type="button" class="btn secondary" @click="downloadId">{{ t('account.downloadAsFile') }}</button>
        </div>
        <label class="check-row"
          ><input v-model="savedAck" type="checkbox" />{{ t('account.iHaveSavedMyAccount') }}</label
        >
        <button type="button" class="btn primary wide" :disabled="!savedAck" @click="finishCreate">
          {{ t('account.continue') }}<Icon name="arrow" />
        </button>
      </div>

      <div v-else class="auth-body">
        <div class="seg seg-lg" role="tablist" :aria-label="t('account.account')">
          <button
            type="button"
            role="tab"
            :aria-selected="mode === 'create'"
            :aria-pressed="mode === 'create'"
            @click="mode = 'create'"
          >
            <strong>{{ t('account.create') }}</strong>
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="mode === 'signin'"
            :aria-pressed="mode === 'signin'"
            @click="mode = 'signin'"
          >
            <strong>{{ t('account.signIn') }}</strong>
          </button>
        </div>
        <h2 id="auth-dialog-title" class="serif auth-title">
          {{
            mode === 'create'
              ? t('account.yourAtlasEverywhere')
              : reauth
                ? t('account.confirmItIsYou')
                : t('account.welcomeBack')
          }}
        </h2>
        <p v-if="mode === 'create'" class="muted">{{ t('account.anOptionalAccountSyncsSettings2') }}</p>
        <div class="seg" role="group" :aria-label="t('account.method')">
          <button type="button" :aria-pressed="kind === 'id'" @click="kind = 'id'">
            {{ t('account.accountIdNoEmail') }}
          </button>
          <button type="button" :aria-pressed="kind === 'email'" @click="kind = 'email'">Email</button>
        </div>
        <form class="form" novalidate @submit.prevent="mode === 'create' ? create() : signIn()">
          <label v-if="mode === 'create'" class="field"
            >{{ t('account.name') }} <small>{{ t('account.optionalShownOnlyToYou') }}</small
            ><input v-model="form.name" autocomplete="nickname" maxlength="40"
          /></label>
          <label v-if="kind === 'email'" class="field"
            >Email<input
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              :aria-invalid="!!errors.email"
            /><span v-if="errors.email" class="field-error">{{ errors.email }}</span></label
          >
          <label v-if="mode === 'signin' && kind === 'id'" class="field"
            >{{ t('account.accountId')
            }}<input
              v-model="form.id"
              autocomplete="username"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              spellcheck="false"
              autocapitalize="characters"
              class="mono"
          /></label>
          <label class="field"
            >{{ t('account.password')
            }}<input
              v-model="form.password"
              type="password"
              :autocomplete="mode === 'create' ? 'new-password' : 'current-password'"
              required
              :aria-invalid="!!errors.password"
            /><span v-if="errors.password" class="field-error">{{ errors.password }}</span></label
          >
          <label v-if="mode === 'create'" class="field"
            >{{ t('account.repeatPassword')
            }}<input
              v-model="form.password2"
              type="password"
              autocomplete="new-password"
              required
              :aria-invalid="!!errors.password2"
            /><span v-if="errors.password2" class="field-error">{{ errors.password2 }}</span></label
          >
          <label class="check-row"
            ><input v-model="form.remember" type="checkbox" />{{ t('account.keepMeSignedInOn') }}</label
          >
          <p v-if="errors.form" class="alert" role="alert">{{ errors.form }}</p>
          <button type="submit" class="btn primary wide" :disabled="busy">
            {{
              mode === 'create'
                ? kind === 'id'
                  ? t('account.createAccountGetMyId')
                  : t('account.createAccount')
                : t('account.signIn')
            }}
          </button>
        </form>
        <p class="hint">
          {{ kind === 'id' ? t('account.weGenerateA16Character') : t('account.emailRecoveryAndVerificationAre') }}
        </p>
      </div>
    </dialog>
  </aside>
</template>
