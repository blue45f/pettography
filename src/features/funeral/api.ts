import { funeralMock } from './mockData'

import type { FuneralService } from './schema'
import type { SpeciesCategory } from '@features/species'

const NETWORK_LATENCY_MS = 60

function delay<T>(value: T, ms = NETWORK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export interface ListFuneralParams {
  category?: SpeciesCategory
}

export async function listFuneral(params: ListFuneralParams = {}): Promise<FuneralService[]> {
  const filtered = funeralMock.filter((f) => {
    if (params.category && !f.supportedCategories.includes(params.category)) return false
    return true
  })
  return delay(filtered)
}
