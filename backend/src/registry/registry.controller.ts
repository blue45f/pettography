import { Controller, Get } from '@nestjs/common';
import { RegistryService } from './registry.service';
import type { RegistryLinks, SpeciesCategory, WildlifeFiling } from '../common/types';

@Controller('registry')
export class RegistryController {
  constructor(private readonly registryService: RegistryService) {}

  @Get('filings')
  findFilings(): WildlifeFiling[] {
    return this.registryService.findFilings();
  }

  @Get('regulated-categories')
  findRegulatedCategories(): SpeciesCategory[] {
    return this.registryService.findRegulatedCategories();
  }

  @Get('links')
  findLinks(): RegistryLinks {
    return this.registryService.findLinks();
  }
}
