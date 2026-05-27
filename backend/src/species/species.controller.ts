import { Controller, Get, Param, Query } from '@nestjs/common';
import { SpeciesService } from './species.service';
import { QuerySpeciesDto } from './dto/query-species.dto';
import type { Species } from '../common/types';

@Controller('species')
export class SpeciesController {
  constructor(private readonly speciesService: SpeciesService) {}

  @Get()
  findAll(@Query() query: QuerySpeciesDto): Species[] {
    return this.speciesService.findAll(query);
  }

  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string): Species {
    return this.speciesService.findOne(idOrSlug);
  }
}
