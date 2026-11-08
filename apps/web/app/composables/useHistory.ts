import { firstTryCorrect, type Session } from '@countrybox/domain'

/** Guest practice history in IndexedDB (versioned). Falls back to memory when IDB is unavailable. */
const DB = 'countrybox',
  VERSION = 1,
  STORE = 'sessions'
const sessions = shallowRef<Session[]>([])
const loaded = ref(false)
const memory = new Map<string, Session>()
let dbP: Promise<IDBDatabase | null> | null = null

function open(): Promise<IDBDatabase | null> {
  if (dbP) return dbP
  dbP = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbP
}
function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return open().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) return resolve(null)
        const req = fn(db.transaction(STORE, mode).objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => resolve(null)
      }),
  )
}
const sortNewest = (a: Session, b: Session) => b.createdAt.localeCompare(a.createdAt)

async function refresh() {
  const all = (await tx<Session[]>('readonly', (s) => s.getAll() as IDBRequest<Session[]>)) ?? [...memory.values()]
  sessions.value = [...all].sort(sortNewest)
  loaded.value = true
}

export function useHistory() {
  if (import.meta.client && !loaded.value) void refresh()
  async function save(s: Session) {
    memory.set(s.id, s)
    const plain = JSON.parse(JSON.stringify(s)) as Session
    await tx('readwrite', (st) => st.put(plain))
    sessions.value = [plain, ...sessions.value.filter((x) => x.id !== s.id)].sort(sortNewest)
  }
  async function get(id: string): Promise<Session | null> {
    return (
      sessions.value.find((s) => s.id === id) ??
      memory.get(id) ??
      (await tx<Session>('readonly', (st) => st.get(id) as IDBRequest<Session>)) ??
      null
    )
  }
  async function clear() {
    memory.clear()
    await tx('readwrite', (st) => st.clear())
    sessions.value = []
  }
  const finished = computed(() => sessions.value.filter((s) => s.status === 'finished'))
  const active = computed(
    () => sessions.value.find((s) => s.status === 'active' && s.questions.some((q) => !q.resolved)) ?? null,
  )
  return { sessions, finished, active, loaded, save, get, clear, refresh }
}

/** Per-country familiarity from local practice: +1 per first-try success, −1 per miss, clamped 0–5. */
export function useFamiliarity() {
  const { finished } = useHistory()
  return computed(() => {
    const score: Record<string, number> = {}
    for (const s of finished.value)
      for (const q of s.questions) {
        if (!q.resolved || !q.guesses.length) continue
        const v = (score[q.targetId] ?? 0) + (firstTryCorrect(q) ? 1 : -1)
        score[q.targetId] = Math.max(0, Math.min(5, v))
      }
    return score
  })
}
