import { speciesCategorySchema } from '@features/species'
import { z } from 'zod'

export const funeralServiceKindSchema = z.enum(['cremation', 'memorial', 'pickup', 'directory'])
export type FuneralServiceKind = z.infer<typeof funeralServiceKindSchema>

export const funeralServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  kind: funeralServiceKindSchema,
  region: z.string(),
  supportedCategories: z.array(speciesCategorySchema).min(1),
  description: z.string(),
  certified: z.boolean(),
  phone: z.string().optional(),
})

export type FuneralService = z.infer<typeof funeralServiceSchema>
