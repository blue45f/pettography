import { z } from 'zod'

export const growthEntrySchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  speciesId: z.string().nullable(),
  measuredAt: z.string(), // YYYY-MM-DD
  weightGram: z.number().positive(),
  lengthCm: z.number().positive().nullable(),
  note: z.string().max(200),
  createdAt: z.string(),
})

export type GrowthEntry = z.infer<typeof growthEntrySchema>

export const growthFormSchema = z.object({
  measuredAt: z.string().min(1, 'growth.errors.dateRequired'),
  weightGram: z
    .number({ message: 'growth.errors.weightNumber' })
    .positive('growth.errors.weightPositive'),
  lengthCm: z
    .number({ message: 'growth.errors.lengthNumber' })
    .positive('growth.errors.lengthPositive')
    .nullable()
    .optional(),
  note: z.string().trim().max(200, 'growth.errors.noteMax'),
})

export type GrowthFormValues = z.infer<typeof growthFormSchema>

/** Typical adult size band for a species, used to contextualize a measurement. */
export interface GrowthNorm {
  /** Typical healthy adult weight range in grams. */
  adultWeightMinG: number
  adultWeightMaxG: number
  /** Typical adult total length range in cm (optional — e.g. snakes/axolotl). */
  adultLengthMinCm?: number
  adultLengthMaxCm?: number
  /** Approximate months to reach adult size — for the growth-pace hint. */
  monthsToAdult: number
}

export type WeightStatus = 'below' | 'normal' | 'above'
