import api from '@infrastructure/api'

import { communitiesMock } from './mockData'
import { communitySchema, type Community } from './schema'

import type { SpeciesCategory } from '@domains/species'

const USE_REMOTE = Boolean(import.meta.env.VITE_API_URL)
const NETWORK_LATENCY_MS = 60

function delay<T>(value: T, ms = NETWORK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export interface ListCommunitiesParams {
  category?: SpeciesCategory
}

export async function listCommunities(params: ListCommunitiesParams = {}): Promise<Community[]> {
  if (USE_REMOTE) {
    const search: Record<string, string> = {}
    if (params.category) search.category = params.category
    const res = await api.get<Community[]>('/communities', { params: search })
    return communitySchema.array().parse(res.data)
  }
  const filtered = communitiesMock.filter((c) => {
    if (params.category && !c.supportedCategories.includes(params.category)) return false
    return true
  })
  return delay(filtered)
}
