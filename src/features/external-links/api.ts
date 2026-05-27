import { externalLinksMock } from './mockData'
import {
  externalLinkSchema,
  type ExternalLink,
  type LinkCategory,
  type SpeciesCategory,
} from './schema'

export interface ListLinksParams {
  category?: LinkCategory
  speciesCategory?: SpeciesCategory
}

const NETWORK_LATENCY_MS = 60

function delay<T>(value: T, ms = NETWORK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export async function listExternalLinks(params: ListLinksParams = {}): Promise<ExternalLink[]> {
  const filtered = externalLinksMock.filter((link) => {
    if (params.category && link.category !== params.category) return false
    if (params.speciesCategory) {
      const matchesGeneral = link.speciesCategories.includes('general')
      const matchesSpecies = link.speciesCategories.includes(params.speciesCategory)
      if (!matchesGeneral && !matchesSpecies) return false
    }
    return true
  })
  return delay(filtered)
}

export const __schema = externalLinkSchema
