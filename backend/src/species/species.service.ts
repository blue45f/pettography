import { Injectable, NotFoundException } from '@nestjs/common'
import { SPECIES_SEED } from '../data/species.seed'
import type { Species } from '../common/types'
import type { QuerySpeciesDto } from './dto/query-species.dto'

@Injectable()
export class SpeciesService {
  private readonly items: Species[] = SPECIES_SEED

  findAll(query: QuerySpeciesDto): Species[] {
    const { category, difficulty, q } = query
    const needle = q?.trim().toLowerCase()

    return this.items.filter((s) => {
      if (category && s.category !== category) return false
      if (difficulty && s.difficulty !== difficulty) return false
      if (needle) {
        const haystack = [s.koreanName, s.scientificName, s.slug, ...s.tags].join(' ').toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })
  }

  findOne(idOrSlug: string): Species {
    const key = idOrSlug.trim().toLowerCase()
    const found = this.items.find((s) => s.id.toLowerCase() === key || s.slug.toLowerCase() === key)
    if (!found) {
      throw new NotFoundException(`Species not found: ${idOrSlug}`)
    }
    return found
  }
}
