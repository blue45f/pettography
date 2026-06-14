import { z } from 'zod'

/**
 * Medication & Quarantine domain model.
 *
 * Dosing model decision: a `Medication` carries a recurring schedule
 * (`startedAt` + `frequencyDays`, optionally bounded by `durationDays`) plus a
 * list of `DoseRecord`s. Each record is a `{ date, given }` pair keyed by a
 * `YYYY-MM-DD` day-date — we only ever keep one record per day and treat
 * `given: true` as "this dose was administered". Marking a dose toggles or
 * upserts the record for that date, so adherence is a simple lookup by date.
 */

export const doseRecordSchema = z.object({
  /** Day-date the dose applies to, `YYYY-MM-DD`. */
  date: z.string(),
  given: z.boolean(),
})

export type DoseRecord = z.infer<typeof doseRecordSchema>

export const medicationSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  name: z.string().max(60),
  reason: z.string().max(120),
  dosage: z.string().max(60),
  /** First dose day-date, `YYYY-MM-DD`. */
  startedAt: z.string(),
  /** Days between doses (>= 1). */
  frequencyDays: z.number().int().min(1),
  /** Total course length in days, or null for an open-ended course. */
  durationDays: z.number().int().min(1).nullable(),
  notes: z.string().max(300),
  doses: z.array(doseRecordSchema),
  createdAt: z.string(),
})

export type Medication = z.infer<typeof medicationSchema>

export const quarantineReasonSchema = z.enum(['newArrival', 'illness', 'postVet', 'other'])
export type QuarantineReason = z.infer<typeof quarantineReasonSchema>

export const QUARANTINE_REASONS: readonly QuarantineReason[] = [
  'newArrival',
  'illness',
  'postVet',
  'other',
] as const

/** Quick-pick quarantine lengths surfaced in the form. */
export const QUARANTINE_DURATION_PRESETS: readonly number[] = [30, 60, 90] as const
export const QUARANTINE_DEFAULT_DURATION = 30
export const QUARANTINE_MAX_DURATION = 180

export const quarantineSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  animalName: z.string().max(60),
  /** Quarantine start day-date, `YYYY-MM-DD`. */
  startedAt: z.string(),
  durationDays: z.number().int().min(1).max(QUARANTINE_MAX_DURATION),
  reasonCode: quarantineReasonSchema,
  /** Day-date the quarantine was cleared, or null while still active. */
  clearedAt: z.string().nullable(),
  notes: z.string().max(300),
  createdAt: z.string(),
})

export type Quarantine = z.infer<typeof quarantineSchema>

/* ------------------------------------------------------------------ */
/* Form schemas (i18n error keys)                                      */
/* ------------------------------------------------------------------ */

export const medicationFormSchema = z.object({
  name: z.string().trim().min(1, 'meds.errors.nameRequired').max(60, 'meds.errors.nameMax'),
  reason: z.string().trim().max(120, 'meds.errors.reasonMax'),
  dosage: z.string().trim().max(60, 'meds.errors.dosageMax'),
  startedAt: z.string().min(1, 'meds.errors.dateRequired'),
  frequencyDays: z
    .number({ message: 'meds.errors.frequencyNumber' })
    .int('meds.errors.frequencyNumber')
    .min(1, 'meds.errors.frequencyMin'),
  durationDays: z
    .number({ message: 'meds.errors.durationNumber' })
    .int('meds.errors.durationNumber')
    .min(1, 'meds.errors.durationMin')
    .nullable()
    .optional(),
  notes: z.string().trim().max(300, 'meds.errors.notesMax'),
})

export type MedicationFormValues = z.infer<typeof medicationFormSchema>

export const quarantineFormSchema = z.object({
  animalName: z
    .string()
    .trim()
    .min(1, 'meds.errors.animalNameRequired')
    .max(60, 'meds.errors.animalNameMax'),
  startedAt: z.string().min(1, 'meds.errors.dateRequired'),
  durationDays: z
    .number({ message: 'meds.errors.qDurationNumber' })
    .int('meds.errors.qDurationNumber')
    .min(1, 'meds.errors.qDurationMin')
    .max(QUARANTINE_MAX_DURATION, 'meds.errors.qDurationMax'),
  reasonCode: quarantineReasonSchema,
  notes: z.string().trim().max(300, 'meds.errors.notesMax'),
})

export type QuarantineFormValues = z.infer<typeof quarantineFormSchema>
