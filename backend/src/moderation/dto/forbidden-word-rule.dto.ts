import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { ForbiddenWordAction, ForbiddenWordMatchType } from '../../common/types';

const FORBIDDEN_WORD_ACTIONS = [
  'block',
  'review',
] as const satisfies readonly ForbiddenWordAction[];
const FORBIDDEN_WORD_MATCH_TYPES = [
  'contains',
  'whole_word',
] as const satisfies readonly ForbiddenWordMatchType[];

export class CreateForbiddenWordRuleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  phrase!: string;

  @IsEnum(FORBIDDEN_WORD_ACTIONS)
  action!: ForbiddenWordAction;

  @IsEnum(FORBIDDEN_WORD_MATCH_TYPES)
  matchType!: ForbiddenWordMatchType;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;
}

export class UpdateForbiddenWordRuleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  phrase?: string;

  @IsOptional()
  @IsEnum(FORBIDDEN_WORD_ACTIONS)
  action?: ForbiddenWordAction;

  @IsOptional()
  @IsEnum(FORBIDDEN_WORD_MATCH_TYPES)
  matchType?: ForbiddenWordMatchType;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string | null;
}
