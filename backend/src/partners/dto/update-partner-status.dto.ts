import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import type { PartnerStatus } from '../../common/types'

const REVIEW_STATUSES = ['approved', 'rejected'] as const satisfies readonly PartnerStatus[]

export class UpdatePartnerStatusDto extends createZodDto(
  z.object({
    status: z.enum(REVIEW_STATUSES, { error: '검토 상태가 유효하지 않습니다.' }),
  })
) {}
