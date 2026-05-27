import { Injectable } from '@nestjs/common';
import { COMMUNITIES_SEED } from '../data/communities.seed';
import type { Community } from '../common/types';
import type { QueryCommunitiesDto } from './dto/query-communities.dto';

@Injectable()
export class CommunitiesService {
  private readonly items: Community[] = COMMUNITIES_SEED;

  findAll(query: QueryCommunitiesDto): Community[] {
    const { category } = query;
    if (!category) return this.items;
    return this.items.filter((c) => c.supportedCategories.includes(category));
  }
}
