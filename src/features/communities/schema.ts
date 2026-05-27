import { speciesCategorySchema } from '@features/species'
import { z } from 'zod'

export const communityKindSchema = z.enum(['forum', 'cafe', 'discord', 'youtube'])
export type CommunityKind = z.infer<typeof communityKindSchema>

export const communitySchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  kind: communityKindSchema,
  language: z.string(),
  supportedCategories: z.array(speciesCategorySchema).min(1),
  memberHint: z.string().optional(),
})

export type Community = z.infer<typeof communitySchema>
