import api from '@infrastructure/api'

import { findSpeciesById, speciesMock } from './mockData'
import { speciesSchema, type Species, type SpeciesCategory } from './schema'

const USE_REMOTE = Boolean(import.meta.env.VITE_API_URL)
const NETWORK_LATENCY_MS = 80

function delay<T>(value: T, ms = NETWORK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export interface ListSpeciesParams {
  category?: SpeciesCategory
  q?: string
}

export async function listSpecies(params: ListSpeciesParams = {}): Promise<Species[]> {
  if (USE_REMOTE) {
    const search: Record<string, string> = {}
    if (params.category) search.category = params.category
    if (params.q) search.q = params.q
    const res = await api.get<Species[]>('/species', { params: search })
    return speciesSchema.array().parse(res.data)
  }

  const filtered = speciesMock.filter((s) => {
    if (params.category && s.category !== params.category) return false
    if (params.q) {
      const q = params.q.toLowerCase()
      if (
        !s.koreanName.toLowerCase().includes(q) &&
        !s.scientificName.toLowerCase().includes(q) &&
        !s.tags.some((tag) => tag.toLowerCase().includes(q))
      ) {
        return false
      }
    }
    return true
  })
  return delay(filtered)
}

export async function getSpecies(idOrSlug: string): Promise<Species | null> {
  if (USE_REMOTE) {
    const res = await api.get<Species>(`/species/${encodeURIComponent(idOrSlug)}`)
    return res.data ? speciesSchema.parse(res.data) : null
  }
  return delay(findSpeciesById(idOrSlug) ?? null)
}
