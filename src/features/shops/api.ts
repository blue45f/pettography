import { haversineDistanceKm, type Coordinates } from '@features/location'
import api from '@services/api'

import { shopsMock } from './mockData'
import { shopSchema, type Shop, type ShopKind, type ShopWithDistance } from './schema'

import type { SpeciesCategory } from '@features/species'

const USE_REMOTE = Boolean(import.meta.env.VITE_API_URL)
const NETWORK_LATENCY_MS = 80

function delay<T>(value: T, ms = NETWORK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export interface ListShopsParams {
  category?: SpeciesCategory
  kind?: ShopKind
  origin?: Coordinates
  radiusKm?: number
}

function withDistance(shop: Shop, origin?: Coordinates): ShopWithDistance {
  if (!origin || shop.lat === null || shop.lng === null) {
    return { ...shop, distanceKm: null }
  }
  return {
    ...shop,
    distanceKm:
      Math.round(haversineDistanceKm(origin, { lat: shop.lat, lng: shop.lng }) * 100) / 100,
  }
}

export async function listShops(params: ListShopsParams = {}): Promise<ShopWithDistance[]> {
  if (USE_REMOTE) {
    const search: Record<string, string> = {}
    if (params.category) search.category = params.category
    if (params.kind) search.kind = params.kind
    if (params.origin) {
      search.lat = String(params.origin.lat)
      search.lng = String(params.origin.lng)
    }
    if (params.radiusKm !== undefined) search.radiusKm = String(params.radiusKm)
    const res = await api.get<ShopWithDistance[]>('/shops', { params: search })
    return res.data.map((s) => ({
      ...shopSchema.parse(s),
      distanceKm: s.distanceKm ?? null,
    }))
  }

  const base = shopsMock.filter((s) => {
    if (params.category && !s.supportedCategories.includes(params.category)) return false
    if (params.kind && s.kind !== params.kind && s.kind !== 'both') return false
    return true
  })

  const withDist = base.map((s) => withDistance(s, params.origin))

  const inRadius =
    params.origin && params.radiusKm !== undefined
      ? withDist.filter(
          (s) => s.distanceKm === null || s.distanceKm <= (params.radiusKm ?? Infinity)
        )
      : withDist

  if (params.origin) {
    inRadius.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0
      if (a.distanceKm === null) return 1
      if (b.distanceKm === null) return -1
      return a.distanceKm - b.distanceKm
    })
  }

  return delay(inRadius)
}
