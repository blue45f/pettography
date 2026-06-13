import { speciesCategorySchema } from '@domains/species'
import { communityKindSchema } from '@pettography/shared'
import { z } from 'zod'

export { communityKindSchema } from '@pettography/shared'
export type { CommunityKind } from '@pettography/shared'

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
