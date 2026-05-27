import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import type { SpeciesCategory } from '../../common/types';

const SPECIES_CATEGORIES = [
  'reptile',
  'arthropod',
  'bird',
  'amphibian',
  'mammal',
] as const satisfies readonly SpeciesCategory[];

export class CreatePostDto {
  @IsEnum(SPECIES_CATEGORIES)
  category!: SpeciesCategory;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  author!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}
