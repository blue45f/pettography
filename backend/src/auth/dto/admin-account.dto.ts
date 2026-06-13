import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import type { AccountRole, AccountStatus } from '../../common/types';

const ACCOUNT_ROLES = ['member', 'moderator', 'admin'] as const satisfies readonly AccountRole[];
const ACCOUNT_STATUSES = [
  'active',
  'suspended',
  'withdrawn',
] as const satisfies readonly AccountStatus[];

export class AdminUpdateAccountDto extends createZodDto(
  z.object({
    name: z.string().min(1).max(80).optional(),
    role: z.enum(ACCOUNT_ROLES).optional(),
    status: z.enum(ACCOUNT_STATUSES).optional(),
  }),
) {}
