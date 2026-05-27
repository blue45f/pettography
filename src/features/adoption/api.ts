import { adoptionMock } from './mockData'

import type { AdoptionListing } from './schema'
import type { SpeciesCategory } from '@features/species'

const NETWORK_LATENCY_MS = 60

function delay<T>(value: T, ms = NETWORK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export interface ListAdoptionParams {
  category?: SpeciesCategory
}

export async function listAdoption(params: ListAdoptionParams = {}): Promise<AdoptionListing[]> {
  const filtered = adoptionMock.filter((a) => {
    if (params.category && !a.supportedCategories.includes(params.category)) return false
    return true
  })
  return delay(filtered)
}
