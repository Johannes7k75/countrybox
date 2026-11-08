import type { Catalog, CatalogCountry } from '@countrybox/catalog'
import data from '@countrybox/catalog/generated/countries.json' with { type: 'json' }

/** The API pins the catalog release it was built with; reviews validate membership against it. */
export const catalog = data as unknown as Catalog
export const byId: ReadonlyMap<string, CatalogCountry> = new Map(catalog.countries.map((c) => [c.id, c]))
