import { z } from 'zod'

export const vitalTypeSchema = z.enum(['respiration', 'heartrate'])
export type VitalType = z.infer<typeof vitalTypeSchema>

export const VITAL_TYPES: readonly VitalType[] = ['respiration', 'heartrate'] as const

/** Allowed counting windows, in seconds. */
export const VITAL_DURATIONS: readonly number[] = [15, 30, 60] as const

export const vitalReadingSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  speciesId: z.string().nullable(),
  type: vitalTypeSchema,
  bpm: z.number().nonnegative(),
  measuredAt: z.string(),
  durationSec: z.number().int(),
  taps: z.number().int(),
  note: z.string().max(200),
  createdAt: z.string(),
})

export type VitalReading = z.infer<typeof vitalReadingSchema>
