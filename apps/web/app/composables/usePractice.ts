import { createSession, randomSeed, type SessionConfig } from '@countrybox/domain'

export type StartConfig = Omit<SessionConfig, 'kind'> & { kind?: SessionConfig['kind'] }

/** Creates a local practice session, stores it, and opens it. Returns an error reason when the pool is empty. */
export function usePractice() {
  const { ready } = useCatalog()
  const { save } = useHistory()
  const { t } = useT()
  const { toast } = useFeedback()
  const { load: loadNeighbors } = useNeighbors()
  async function start(cfg: StartConfig): Promise<boolean> {
    const catalog = await ready()
    const neighbors = cfg.difficulty === 'hard' ? await loadNeighbors() : null
    const res = createSession(
      catalog.countries,
      catalog.version,
      { kind: 'practice', ...cfg },
      { id: crypto.randomUUID(), seed: randomSeed(), now: new Date(), neighbors },
    )
    if (!res.ok) {
      toast(t('common.noCountriesFitThisCombination'))
      return false
    }
    await save(res.session)
    await navigateTo(`/practice/session/${res.session.id}`)
    return true
  }
  return { start }
}
