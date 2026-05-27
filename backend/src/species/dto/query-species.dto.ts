import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { SpeciesCategory, SpeciesDifficulty } from '../../common/types';

const SPECIES_CATEGORIES = [
  'reptile',
  'arthropod',
  'bird',
  'amphibian',
  'mammal',
] as const satisfies readonly SpeciesCategory[];

const SPECIES_DIFFICULTIES = [
  'beginner',
  'intermediate',
  'advanced',
] as const satisfies readonly SpeciesDifficulty[];

export class QuerySpeciesDto {
  @IsOptional()
  @IsEnum(SPECIES_CATEGORIES)
  category?: SpeciesCategory;

  @IsOptional()
  @IsEnum(SPECIES_DIFFICULTIES)
  difficulty?: SpeciesDifficulty;

  @IsOptional()
  @IsString()
  q?: string;
}
