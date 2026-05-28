import { haversineDistanceKm, type Coordinates } from '@features/location'
import api from '@services/api'

import { hospitalsMock } from './mockData'
import { hospitalSchema, type Hospital, type HospitalWithDistance } from './schema'

import type { SpeciesCategory } from '@features/species'

const USE_REMOTE = Boolean(import.meta.env.VITE_API_URL)
const NETWORK_LATENCY_MS = 80

function delay<T>(value: T, ms = NETWORK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export interface ListHospitalsParams {
  category?: SpeciesCategory
  origin?: Coordinates
  radiusKm?: number
}

function withDistance(hospital: Hospital, origin?: Coordinates): HospitalWithDistance {
  return {
    ...hospital,
    distanceKm: origin
      ? Math.round(haversineDistanceKm(origin, { lat: hospital.lat, lng: hospital.lng }) * 100) /
        100
      : Number.POSITIVE_INFINITY,
  }
}

export async function listHospitals(
  params: ListHospitalsParams = {},
): Promise<HospitalWithDistance[]> {
  if (USE_REMOTE) {
    const search: Record<string, string> = {}
    if (params.category) search.category = params.category
    if (params.origin) {
      search.lat = String(params.origin.lat)
      search.lng = String(params.origin.lng)
    }
    if (params.radiusKm !== undefined) search.radiusKm = String(params.radiusKm)
    const res = await api.get<HospitalWithDistance[]>('/hospitals', { params: search })
    return res.data.map((h) => ({
      ...hospitalSchema.parse(h),
      distanceKm: h.distanceKm ?? Number.POSITIVE_INFINITY,
    }))
  }

  const base = hospitalsMock.filter((h) => {
    if (params.category && !h.supportedCategories.includes(params.category)) return false
    return true
  })

  const withDist = base.map((h) => withDistance(h, params.origin))

  const withinRadius =
    params.origin && params.radiusKm !== undefined
      ? withDist.filter((h) => h.distanceKm <= (params.radiusKm ?? Infinity))
      : withDist

  if (params.origin) {
    withinRadius.sort((a, b) => a.distanceKm - b.distanceKm)
  }

  return delay(withinRadius)
}

export async function getHospital(id: string): Promise<HospitalWithDistance | null> {
  if (USE_REMOTE) {
    const res = await api.get<HospitalWithDistance>(`/hospitals/${encodeURIComponent(id)}`)
    if (!res.data) return null
    return {
      ...hospitalSchema.parse(res.data),
      distanceKm: res.data.distanceKm ?? Number.POSITIVE_INFINITY,
    }
  }
  const found = hospitalsMock.find((h) => h.id === id)
  return delay(found ? withDistance(found) : null)
}
