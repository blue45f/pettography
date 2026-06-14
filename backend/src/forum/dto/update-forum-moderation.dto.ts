import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const MODERATION_STATUSES = ['visible', 'needs_review'] as const

export class UpdateForumModerationDto extends createZodDto(
  z.object({
    hiddenByAdmin: z.boolean().optional(),
    moderationStatus: z.enum(MODERATION_STATUSES).optional(),
  })
) {}
