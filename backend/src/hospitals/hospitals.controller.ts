import { Controller, Get, Param, Query } from '@nestjs/common';
import { HospitalsService, HospitalWithDistance } from './hospitals.service';
import { QueryHospitalsDto } from './dto/query-hospitals.dto';
import type { Hospital } from '../common/types';

@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Get()
  findAll(@Query() query: QueryHospitalsDto): HospitalWithDistance[] {
    return this.hospitalsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Hospital {
    return this.hospitalsService.findOne(id);
  }
}
