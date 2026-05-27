import { Type } from 'class-transformer';
import { IsEnum, IsLatitude, IsLongitude, IsNumber, IsOptional, Min } from 'class-validator';
import type { ShopKind, SpeciesCategory } from '../../common/types';

const SPECIES_CATEGORIES = [
  'reptile',
  'arthropod',
  'bird',
  'amphibian',
  'mammal',
] as const satisfies readonly SpeciesCategory[];

const SHOP_KINDS = ['food', 'equipment', 'both'] as const satisfies readonly ShopKind[];

export class QueryShopsDto {
  @IsOptional()
  @IsEnum(SPECIES_CATEGORIES)
  category?: SpeciesCategory;

  @IsOptional()
  @IsEnum(SHOP_KINDS)
  kind?: ShopKind;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  radiusKm?: number;
}
