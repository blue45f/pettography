import { speciesCategorySchema } from '@domains/species'
import { z } from 'zod'

export const hospitalSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  district: z.string(),
  lat: z.number(),
  lng: z.number(),
  phone: z.string(),
  supportedCategories: z.array(speciesCategorySchema).min(1),
  hours: z.string(),
  hasEmergency: z.boolean(),
  mapUrl: z.string().url(),
})

export type Hospital = z.infer<typeof hospitalSchema>

export interface HospitalWithDistance extends Hospital {
  distanceKm: number
}
