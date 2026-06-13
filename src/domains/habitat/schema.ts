import { speciesCategorySchema, type SpeciesCategory } from '@domains/species'
import { z } from 'zod'

export const habitatEntrySchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  measuredAt: z.string(),
  temperatureC: z.number().nullable(),
  humidityPct: z.number().nullable(),
  uvbHoursToday: z.number().nullable(),
  note: z.string().max(200).optional(),
})
export type HabitatEntry = z.infer<typeof habitatEntrySchema>

export const habitatFormSchema = z.object({
  measuredAt: z.string().min(1, 'habitat.errors.dateRequired'),
  temperatureC: z
    .number({ message: 'habitat.errors.tempNumber' })
    .min(-10, 'habitat.errors.tempRange')
    .max(60, 'habitat.errors.tempRange')
    .nullable()
    .optional(),
  humidityPct: z
    .number({ message: 'habitat.errors.humidityNumber' })
    .min(0, 'habitat.errors.humidityRange')
    .max(100, 'habitat.errors.humidityRange')
    .nullable()
    .optional(),
  uvbHoursToday: z
    .number({ message: 'habitat.errors.uvbNumber' })
    .min(0, 'habitat.errors.uvbRange')
    .max(24, 'habitat.errors.uvbRange')
    .nullable()
    .optional(),
  note: z.string().trim().max(200).optional(),
})
export type HabitatFormValues = z.infer<typeof habitatFormSchema>

export interface HabitatRange {
  tempMin: number
  tempMax: number
  humidityMin: number
  humidityMax: number
  uvbRecommended: boolean
}

export const HABITAT_RECOMMENDATIONS: Record<SpeciesCategory, HabitatRange> = {
  reptile: { tempMin: 24, tempMax: 32, humidityMin: 30, humidityMax: 70, uvbRecommended: true },
  arthropod: { tempMin: 22, tempMax: 28, humidityMin: 60, humidityMax: 80, uvbRecommended: false },
  bird: { tempMin: 18, tempMax: 28, humidityMin: 40, humidityMax: 60, uvbRecommended: false },
  amphibian: { tempMin: 16, tempMax: 22, humidityMin: 70, humidityMax: 90, uvbRecommended: false },
  mammal: { tempMin: 22, tempMax: 28, humidityMin: 30, humidityMax: 60, uvbRecommended: false },
}

export const _categories = speciesCategorySchema
