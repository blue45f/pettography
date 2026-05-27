import { Controller, Get, Query } from '@nestjs/common';
import { AdoptionService } from './adoption.service';
import { QueryAdoptionDto } from './dto/query-adoption.dto';
import type { AdoptionListing } from '../common/types';

@Controller('adoption')
export class AdoptionController {
  constructor(private readonly adoptionService: AdoptionService) {}

  @Get()
  findAll(@Query() query: QueryAdoptionDto): AdoptionListing[] {
    return this.adoptionService.findAll(query);
  }
}
