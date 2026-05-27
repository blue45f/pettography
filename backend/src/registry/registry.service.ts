import { Injectable } from '@nestjs/common';
import {
  REGISTRY_FILINGS_SEED,
  REGISTRY_LINKS_SEED,
  REGULATED_CATEGORIES_SEED,
} from '../data/registry.seed';
import type { RegistryLinks, SpeciesCategory, WildlifeFiling } from '../common/types';

@Injectable()
export class RegistryService {
  private readonly filings: WildlifeFiling[] = REGISTRY_FILINGS_SEED;
  private readonly regulatedCategories: SpeciesCategory[] = REGULATED_CATEGORIES_SEED;
  private readonly links: RegistryLinks = REGISTRY_LINKS_SEED;

  findFilings(): WildlifeFiling[] {
    return this.filings;
  }

  findRegulatedCategories(): SpeciesCategory[] {
    return this.regulatedCategories;
  }

  findLinks(): RegistryLinks {
    return this.links;
  }
}
