import { Controller, Get, Query } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { QueryCommunitiesDto } from './dto/query-communities.dto';
import type { Community } from '../common/types';

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  findAll(@Query() query: QueryCommunitiesDto): Community[] {
    return this.communitiesService.findAll(query);
  }
}
