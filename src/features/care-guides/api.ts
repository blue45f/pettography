import api from '@services/api'

import { careGuidesMock } from './mockData'
import { careGuideSchema, type CareGuide } from './schema'

const USE_REMOTE = Boolean(import.meta.env.VITE_API_URL)
const NETWORK_LATENCY_MS = 80

function delay<T>(value: T, ms = NETWORK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export async function getCareGuide(speciesId: string): Promise<CareGuide | null> {
  if (USE_REMOTE) {
    const res = await api.get<CareGuide>(`/care-guides/${encodeURIComponent(speciesId)}`)
    return res.data ? careGuideSchema.parse(res.data) : null
  }
  const found = careGuidesMock.find((g) => g.speciesId === speciesId)
  return delay(found ?? null)
}
