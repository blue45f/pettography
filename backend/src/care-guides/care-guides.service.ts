import { Injectable, NotFoundException } from '@nestjs/common'
import { CARE_GUIDES_SEED } from '../data/care-guides.seed'
import type { CareGuide } from '../common/types'

@Injectable()
export class CareGuidesService {
  private readonly items: CareGuide[] = CARE_GUIDES_SEED

  findBySpeciesId(speciesId: string): CareGuide {
    const found = this.items.find((g) => g.speciesId === speciesId)
    if (!found) {
      throw new NotFoundException(`Care guide not found for species: ${speciesId}`)
    }
    return found
  }
}
