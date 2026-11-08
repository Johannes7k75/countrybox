import { firstTryCorrect, questionDirection, type Session } from '@countrybox/domain'

/** Deterministic UUIDv8 for (session, question) so re-uploads are deduplicated server-side. */
async function attemptId(sessionId: string, index: number): Promise<string> {
  const b = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${sessionId}:${index}`)),
  ).slice(0, 16)
  b[6] = (b[6]! & 0x0f) | 0x80
  b[8] = (b[8]! & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/**
 * Offers to upload this device's finished practice to the signed-in account.
 * The "already imported" list is bound to the account id, so signing into another
 * account never silently copies history between accounts.
 */
export function useImport() {
  const { user } = useAccount()
  const { finished } = useHistory()
  const key = computed(() => (user.value ? `countrybox:imported:${user.value.id}` : ''))
  const version = ref(0)
  const imported = computed<string[]>(() => {
    void version.value
    if (!key.value) return []
    try {
      return JSON.parse(localStorage.getItem(key.value) || '[]') as string[]
    } catch {
      return []
    }
  })
  const pending = computed<Session[]>(() => finished.value.filter((s) => !imported.value.includes(s.id)))
  const busy = ref(false)
  async function run(): Promise<number> {
    if (!user.value || busy.value) return 0
    busy.value = true
    try {
      const done = [...imported.value]
      const sessions = pending.value
      const attempts = []
      for (const s of sessions)
        for (const [i, q] of s.questions.entries()) {
          if (!q.resolved || !q.guesses.length) continue
          attempts.push({
            id: await attemptId(s.id, i),
            sessionId: s.id,
            entityId: q.targetId,
            direction: questionDirection(s, q),
            firstCorrect: firstTryCorrect(q),
            assisted: q.assisted,
            catalogVersion: s.catalogVersion,
            answeredAt: s.endedAt ?? s.createdAt,
          })
        }
      for (let i = 0; i < attempts.length; i += 500) {
        const res = await useApi().api.practice.import.$post({ json: { attempts: attempts.slice(i, i + 500) } })
        if (res.status !== 200) throw new Error('import failed')
      }
      done.push(...sessions.map((s) => s.id))
      try {
        localStorage.setItem(key.value, JSON.stringify(done))
      } catch {
        /* ignore */
      }
      version.value++
      return sessions.length
    } finally {
      busy.value = false
    }
  }
  return { pending, busy, run }
}
