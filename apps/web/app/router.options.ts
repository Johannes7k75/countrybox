import type { RouterConfig } from '@nuxt/schema'
// Move focus to <main> after navigation so screen readers start at the new content.
export default <RouterConfig>{
  scrollBehavior(_to, _from, saved) {
    if (import.meta.client) requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }))
    return saved ?? { top: 0 }
  },
}
