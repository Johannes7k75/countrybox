/** Catalog types shared by the build tool, the domain rules, the API and the web app. */
export const REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'] as const
export type Region = (typeof REGIONS)[number]
export const LOCALES = ['en', 'de'] as const
export type Locale = (typeof LOCALES)[number]

export interface Localized<T> {
  en: T
  de: T
}

export interface CatalogCountry {
  /** Stable app ID: lowercase ISO 3166 alpha-2 (`xk` is an app alias, not an ISO assignment). */
  id: string
  iso3: string
  name: Localized<string>
  /** All capital roles; any listed capital is an accepted answer. Empty = not applicable/unknown. */
  capitals: Localized<string[]>
  region: Region
  subregion: string
  tlds: string[]
  /** Country calling codes without '+'. Shared codes (e.g. 1, 7) are expected. */
  callingCodes: string[]
  un: boolean
  independent: boolean
  /** Approximate centre of the largest landmass [lat, lon]; null when no geometry. */
  center: [number, number] | null
  /** Capital location [lat, lon] (GeoNames CC BY 4.0 + reviewed overrides); null when unknown / not applicable. */
  capitalPos: [number, number] | null
  /** Hash of the flag artwork; equal keys = visually identical flags (e.g. territories using a parent flag). */
  flagKey: string
  /** True when the world map has a path for this id. */
  map: boolean
}

export interface Catalog {
  schemaVersion: 1
  /** Content hash of the facts; changes whenever an answer could change. */
  version: string
  countries: CatalogCountry[]
}

export interface WorldMap {
  w: number
  h: number
  lat0: number
  lat1: number
  paths: Record<string, string>
  /** Projected bbox of the largest polygon, [x0, y0, x1, y1]. */
  boxes: Record<string, [number, number, number, number]>
}

/** Equirectangular projection used by the generated world map. */
export function project(map: Pick<WorldMap, 'w' | 'h' | 'lat0' | 'lat1'>, lat: number, lon: number): [number, number] {
  return [((lon + 180) / 360) * map.w, ((map.lat0 - lat) / (map.lat0 - map.lat1)) * map.h]
}

/**
 * Visual flag neighbours, produced offline by tools/similarity (or a future embedding job).
 * neighbors[id] lists other entity ids, most similar first. Similarity ranks distractors; it never decides correctness.
 */
export interface NeighborPack {
  schemaVersion: 1
  /** Content hash of this pack; sessions record it. */
  version: string
  /** Feature method / embedding space, e.g. "lab-grid-v1" or "dinov2-vits14-v1". */
  method: string
  /** Catalog version whose flags were rendered. */
  catalogVersion: string
  k: number
  neighbors: Record<string, string[]>
  /** Same order as neighbors; distance in the method's own metric (not comparable across methods). */
  distances: Record<string, number[]>
}
