import { speciesCategorySchema } from '@domains/species'
import { funeralServiceKindSchema } from '@pettography/shared'
import { z } from 'zod'

export { funeralServiceKindSchema } from '@pettography/shared'
export type { FuneralServiceKind } from '@pettography/shared'

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
