import { IsEnum, IsOptional } from 'class-validator';
import type { SpeciesCategory } from '../../common/types';

const SPECIES_CATEGORIES = [
  'reptile',
  'arthropod',
  'bird',
  'amphibian',
  'mammal',
] as const satisfies readonly SpeciesCategory[];

export class QueryForumDto {
  @IsOptional()
  @IsEnum(SPECIES_CATEGORIES)
  category?: SpeciesCategory;
}
