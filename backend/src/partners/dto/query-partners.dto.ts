import { IsEnum, IsOptional } from 'class-validator';
import type { PartnerStatus } from '../../common/types';

const PARTNER_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const satisfies readonly PartnerStatus[];

export class QueryPartnersDto {
  @IsOptional()
  @IsEnum(PARTNER_STATUSES)
  status?: PartnerStatus;
}
