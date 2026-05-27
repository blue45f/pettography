import { IsEnum } from 'class-validator';
import type { PartnerStatus } from '../../common/types';

const REVIEW_STATUSES = ['approved', 'rejected'] as const satisfies readonly PartnerStatus[];

export class UpdatePartnerStatusDto {
  @IsEnum(REVIEW_STATUSES)
  status!: 'approved' | 'rejected';
}
