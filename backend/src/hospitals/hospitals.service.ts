import { Injectable, NotFoundException } from '@nestjs/common'
import { HOSPITALS_SEED } from '../data/hospitals.seed'
import type { Hospital } from '../common/types'
import { haversineKm } from '../common/geo'
import type { QueryHospitalsDto } from './dto/query-hospitals.dto'

export type HospitalWithDistance = Hospital & { distanceKm?: number }

@Injectable()
export class HospitalsService {
  private readonly items: Hospital[] = HOSPITALS_SEED

  findAll(query: QueryHospitalsDto): HospitalWithDistance[] {
    const { category, lat, lng, radiusKm } = query
    const hasCoords = typeof lat === 'number' && typeof lng === 'number'

    let result: HospitalWithDistance[] = this.items.filter((h) => {
      if (category && !h.supportedCategories.includes(category)) return false
      return true
    })

    if (hasCoords) {
      result = result.map((h) => ({
        ...h,
        distanceKm: haversineKm(lat, lng, h.lat, h.lng),
      }))

      if (typeof radiusKm === 'number') {
        result = result.filter((h) => (h.distanceKm ?? Infinity) <= radiusKm)
      }

      result.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    }

    return result
  }

  findOne(id: string): Hospital {
    const found = this.items.find((h) => h.id === id)
    if (!found) {
      throw new NotFoundException(`Hospital not found: ${id}`)
    }
    return found
  }
}
