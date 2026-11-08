import type { Catalog, CatalogCountry, NeighborPack, WorldMap } from '@countrybox/catalog'

const catalog = shallowRef<Catalog | null>(null)
const world = shallowRef<WorldMap | null>(null)
const error = ref<string | null>(null)
let catalogP: Promise<Catalog> | null = null
let worldP: Promise<WorldMap> | null = null

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url}: ${r.status}`)
  return (await r.json()) as T
}

/** Catalog facts are loaded once; the (larger) world map lazily on first use. */
export function useCatalog() {
  if (import.meta.client && !catalogP) {
    catalogP = getJson<Catalog>('/catalog/countries.json')
    catalogP
      .then((c) => {
        catalog.value = c
      })
      .catch((e: Error) => {
        error.value = e.message
      })
  }
  const countries = computed<CatalogCountry[]>(() => catalog.value?.countries ?? [])
  const byId = computed(() => new Map(countries.value.map((c) => [c.id, c])))
  return { catalog, countries, byId, error, ready: () => catalogP! }
}

export function useWorld() {
  if (import.meta.client && !worldP) {
    worldP = getJson<WorldMap>('/catalog/world.json')
    worldP
      .then((w) => {
        world.value = w
      })
      .catch(() => {
        /* map is optional context */
      })
  }
  return world
}

let neighborsP: Promise<NeighborPack | null> | null = null
const neighbors = shallowRef<NeighborPack | null>(null)
/** Visual flag neighbours (≈70 KB), loaded only when hard mode is used. Null = unavailable → strategies fall back. */
export function useNeighbors() {
  function load(): Promise<NeighborPack | null> {
    neighborsP ??= getJson<NeighborPack>('/catalog/flag-neighbors.json')
      .then((p) => {
        // A pack built for another catalog release must not be mixed in.
        if (catalog.value && p.catalogVersion !== catalog.value.version) return null
        neighbors.value = p
        return p
      })
      .catch(() => null)
    return neighborsP
  }
  return { neighbors, load }
}
