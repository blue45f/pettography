import { speciesCategorySchema } from '@features/species'
import { z } from 'zod'

export const adoptionKindSchema = z.enum(['rescue', 'breeder', 'cafe', 'marketplace'])
export type AdoptionKind = z.infer<typeof adoptionKindSchema>

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
