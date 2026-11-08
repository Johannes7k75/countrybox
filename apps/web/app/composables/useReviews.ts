import type { Queue } from '@countrybox/contracts'
import type { Direction } from '@countrybox/domain'

/** Server review queue for the signed-in user (read-only; presenting/answering lives in the review session page). */
export function useReviews() {
  const queue = useState<Queue | null>('review-queue', () => null)
  const { dueCount } = useAccount()
  const loading = ref(false)
  async function load() {
    loading.value = true
    try {
      const res = await useApi().api.review.queue.$get()
      const body = await res.json()
      if (res.status === 200 && 'due' in body) {
        queue.value = body
        dueCount.value = body.due.length
      }
    } finally {
      loading.value = false
    }
  }
  async function enroll(entityId: string, directions: Direction[]) {
    const res = await useApi().api.review.enroll.$post({ json: { entityId, directions } })
    const body = await res.json()
    if (res.status === 200 && 'due' in body) {
      queue.value = body
      dueCount.value = body.due.length
      return true
    }
    return false
  }
  async function remove(cardId: string) {
    await useApi().api.review.cards[':id'].$delete({ param: { id: cardId } })
    await load()
  }
  return { queue, loading, load, enroll, remove }
}
