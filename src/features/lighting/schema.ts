import { z } from 'zod'

/**
 * A saved lighting / photoperiod schedule for one pet.
 *
 * Photoperiod (day length) and UVB on-time are husbandry levers: they drive
 * appetite, breeding cues, and (via UVB → vitamin D3 synthesis) bone health in
 * diurnal reptiles and birds. We store the lights-on / lights-off hours as
 * whole hours in 0..23 local-clock space; the engine derives the resulting day
 * length (handling the wrap past midnight). `uvbHours` is the daily UVB on-time
 * and is only meaningful when `hasUvb` is true (null otherwise).
 *
 * Persisted one-per-pet under `pettography.lighting`, keyed by pet.
 */
export const lightScheduleSchema = z.object({
  petId: z.string().nullable().optional(),
  speciesId: z.string().nullable(),
  /** Hour the lights come on, 0..23 (local clock). */
  onHour: z.number().int().min(0).max(23),
  /** Hour the lights go off, 0..23 (local clock). */
  offHour: z.number().int().min(0).max(23),
  hasUvb: z.boolean(),
  /** Daily UVB on-time in hours, 0..24. Null when `hasUvb` is false. */
  uvbHours: z.number().int().min(0).max(24).nullable(),
  notes: z.string().max(200),
  updatedAt: z.string(),
})

export type LightSchedule = z.infer<typeof lightScheduleSchema>

/**
 * Editor form. Hours are required integers (RHF supplies defaults), so we avoid
 * the zod `.default()` / `.optional()` friction with the resolver. Error
 * messages are i18n key suffixes resolved in the page via `t(...)`.
 */
export const lightingFormSchema = z.object({
  onHour: z
    .number({ message: 'lighting.errors.hourNumber' })
    .int('lighting.errors.hourInt')
    .min(0, 'lighting.errors.hourRange')
    .max(23, 'lighting.errors.hourRange'),
  offHour: z
    .number({ message: 'lighting.errors.hourNumber' })
    .int('lighting.errors.hourInt')
    .min(0, 'lighting.errors.hourRange')
    .max(23, 'lighting.errors.hourRange'),
  hasUvb: z.boolean(),
  uvbHours: z
    .number({ message: 'lighting.errors.uvbNumber' })
    .int('lighting.errors.uvbInt')
    .min(0, 'lighting.errors.uvbRange')
    .max(24, 'lighting.errors.uvbRange')
    .nullable(),
  notes: z.string().trim().max(200, 'lighting.errors.notesMax'),
})

export type LightingFormValues = z.infer<typeof lightingFormSchema>
