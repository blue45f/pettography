import { speciesCategorySchema } from '@features/species'
import { shopKindSchema } from '@pettography/shared'
import { z } from 'zod'

export { shopKindSchema } from '@pettography/shared'
export type { ShopKind } from '@pettography/shared'

export const shopSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: shopKindSchema,
  address: z.string().nullable(),
  district: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  online: z.string().url().nullable(),
  supportedCategories: z.array(speciesCategorySchema).min(1),
  notes: z.string(),
})

export type Shop = z.infer<typeof shopSchema>

export interface ShopWithDistance extends Shop {
  distanceKm: number | null
}
