import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import type { PartnerKind } from '../../common/types';

const PARTNER_KINDS = ['shop', 'hospital', 'treat-shop'] as const satisfies readonly PartnerKind[];

export class CreatePartnerDto {
  @IsEnum(PARTNER_KINDS)
  kind!: PartnerKind;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  contact!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  region!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  description!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({ require_protocol: true })
  url?: string | null;
}
