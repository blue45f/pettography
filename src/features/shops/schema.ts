import { speciesCategorySchema } from '@features/species'
import { z } from 'zod'

export const shopKindSchema = z.enum(['food', 'equipment', 'both'])
export type ShopKind = z.infer<typeof shopKindSchema>

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
