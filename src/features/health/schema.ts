import { z } from 'zod'

export const weightEntrySchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  measuredAt: z.string(),
  grams: z.number().int().positive(),
  note: z.string().max(200).optional(),
})
export type WeightEntry = z.infer<typeof weightEntrySchema>

export const vaccinationKindSchema = z.enum(['vaccine', 'medication', 'checkup', 'parasite'])
export type VaccinationKind = z.infer<typeof vaccinationKindSchema>

export const VACCINATION_KINDS: readonly VaccinationKind[] = [
  'vaccine',
  'medication',
  'checkup',
  'parasite',
] as const

export const vaccinationEntrySchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  kind: vaccinationKindSchema,
  name: z.string().min(1).max(80),
  administeredAt: z.string(),
  nextDueAt: z.string().nullable(),
  clinic: z.string().max(80).optional(),
  note: z.string().max(200).optional(),
})
export type VaccinationEntry = z.infer<typeof vaccinationEntrySchema>

export const weightFormSchema = z.object({
  measuredAt: z.string().min(1, 'health.errors.dateRequired'),
  grams: z
    .number({ message: 'health.errors.weightNumber' })
    .int()
    .positive('health.errors.weightPositive'),
  note: z.string().trim().max(200, 'health.errors.noteMax').optional(),
})
export type WeightFormValues = z.infer<typeof weightFormSchema>

export const vaccinationFormSchema = z.object({
  kind: vaccinationKindSchema,
  name: z.string().trim().min(1, 'health.errors.nameRequired').max(80, 'health.errors.nameMax'),
  administeredAt: z.string().min(1, 'health.errors.dateRequired'),
  nextDueAt: z.string().optional().nullable(),
  clinic: z.string().trim().max(80, 'health.errors.clinicMax').optional(),
  note: z.string().trim().max(200, 'health.errors.noteMax').optional(),
})
export type VaccinationFormValues = z.infer<typeof vaccinationFormSchema>
