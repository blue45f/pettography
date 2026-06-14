import { speciesCategorySchema } from '@domains/species'
import { adoptionKindSchema } from '@pettography/shared'
import { z } from 'zod'

export { adoptionKindSchema } from '@pettography/shared'
export type { AdoptionKind } from '@pettography/shared'

export const adoptionListingSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  kind: adoptionKindSchema,
  region: z.string(),
  supportedCategories: z.array(speciesCategorySchema).min(1),
  description: z.string(),
  badge: z.string().optional(),
})

export type AdoptionListing = z.infer<typeof adoptionListingSchema>
