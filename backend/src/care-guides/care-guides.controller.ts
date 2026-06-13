import { Controller, Get, Param } from '@nestjs/common'
import { CareGuidesService } from './care-guides.service'
import type { CareGuide } from '../common/types'

@Controller('care-guides')
export class CareGuidesController {
  constructor(private readonly careGuidesService: CareGuidesService) {}

  @Get(':speciesId')
  findOne(@Param('speciesId') speciesId: string): CareGuide {
    return this.careGuidesService.findBySpeciesId(speciesId)
  }
}
