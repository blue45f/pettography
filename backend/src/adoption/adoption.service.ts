import { Injectable } from '@nestjs/common';
import { ADOPTION_SEED } from '../data/adoption.seed';
import type { AdoptionListing } from '../common/types';
import type { QueryAdoptionDto } from './dto/query-adoption.dto';

@Injectable()
export class AdoptionService {
  private readonly items: AdoptionListing[] = ADOPTION_SEED;

  findAll(query: QueryAdoptionDto): AdoptionListing[] {
    const { category } = query;
    if (!category) return this.items;
    return this.items.filter((a) => a.supportedCategories.includes(category));
  }
}
