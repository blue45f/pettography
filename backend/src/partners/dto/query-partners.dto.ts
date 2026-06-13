import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import type { PartnerStatus } from '../../common/types';

const PARTNER_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const satisfies readonly PartnerStatus[];

export class QueryPartnersDto extends createZodDto(
  z.object({
    status: z.enum(PARTNER_STATUSES).optional(),
  }),
) {}
