import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { AccountRole, AccountStatus } from '../../common/types';

const ACCOUNT_ROLES = ['member', 'moderator', 'admin'] as const satisfies readonly AccountRole[];
const ACCOUNT_STATUSES = [
  'active',
  'suspended',
  'withdrawn',
] as const satisfies readonly AccountStatus[];

export class AdminUpdateAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsEnum(ACCOUNT_ROLES)
  role?: AccountRole;

  @IsOptional()
  @IsEnum(ACCOUNT_STATUSES)
  status?: AccountStatus;
}
