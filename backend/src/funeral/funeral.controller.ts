import { Controller, Get, Query } from '@nestjs/common';
import { FuneralService } from './funeral.service';
import { QueryFuneralDto } from './dto/query-funeral.dto';
import type { FuneralService as FuneralServiceItem } from '../common/types';

@Controller('funeral')
export class FuneralController {
  constructor(private readonly funeralService: FuneralService) {}

  @Get()
  findAll(@Query() query: QueryFuneralDto): FuneralServiceItem[] {
    return this.funeralService.findAll(query);
  }
}
