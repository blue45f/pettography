import { z } from 'zod'

import { BRUMATION_PHASE_IDS, type BrumationPhaseId } from './data'

/** A per-phase day-count map, e.g. `{ vetCheck: 7, fasting: 14, … }`. */
export type PhaseDays = Partial<Record<BrumationPhaseId, number>>

/**
 * A saved brumation plan. `phaseDays` holds only the keeper's overrides —
 * the engine fills any missing phase from the template default, so a plan
 * stays valid even if new phases are added later.
 */
export const brumationPlanSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  speciesId: z.string().nullable(),
  /** Day-precision start date, YYYY-MM-DD. */
  startDate: z.string(),
  phaseDays: z.partialRecord(z.enum(BRUMATION_PHASE_IDS), z.number()),
  targetTempC: z.number().nullable(),
  notes: z.string().max(300),
  createdAt: z.string(),
})

export type BrumationPlan = z.infer<typeof brumationPlanSchema>

/**
 * Plan creation form. Per-phase day overrides are optional numbers (defaulting
 * to the template) and error messages are i18n keys resolved in the page.
 */
const phaseDayField = z
  .number({ message: 'brumation.errors.daysNumber' })
  .int('brumation.errors.daysInt')
  .min(1, 'brumation.errors.daysMin')
  .max(365, 'brumation.errors.daysMax')

export const brumationFormSchema = z.object({
  startDate: z.string().min(1, 'brumation.errors.dateRequired'),
  vetCheck: phaseDayField,
  fasting: phaseDayField,
  coolDown: phaseDayField,
  dormancy: phaseDayField,
  warmUp: phaseDayField,
  recovery: phaseDayField,
  targetTempC: z
    .number({ message: 'brumation.errors.tempNumber' })
    .min(0, 'brumation.errors.tempRange')
    .max(40, 'brumation.errors.tempRange')
    .nullable()
    .optional(),
  notes: z.string().trim().max(300, 'brumation.errors.notesMax').optional(),
})

export type BrumationFormValues = z.infer<typeof brumationFormSchema>
