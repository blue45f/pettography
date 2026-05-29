import { z } from 'zod'

/**
 * Life stage used to pick a feeding cadence. Hatchling/juvenile animals eat
 * more often than adults across every species we cover, so the calculator only
 * needs this coarse split to recommend a frequency.
 */
export const ageStageSchema = z.enum(['juvenile', 'adult'])
export type AgeStage = z.infer<typeof ageStageSchema>

export const AGE_STAGES: readonly AgeStage[] = ['juvenile', 'adult'] as const

export const feedLogSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  speciesId: z.string().nullable(),
  /** Day-precision date, YYYY-MM-DD. */
  fedAt: z.string(),
  item: z.string().max(60),
  /** Number of prey items offered; nullable when not tracked. */
  quantity: z.number().int().nonnegative().nullable(),
  /** Whether the animal ate. `false` marks a refusal (거식). */
  accepted: z.boolean(),
  notes: z.string().max(300),
  createdAt: z.string(),
})

export type FeedLog = z.infer<typeof feedLogSchema>

export const feedFormSchema = z.object({
  fedAt: z.string().min(1, 'feeding.errors.dateRequired'),
  item: z.string().trim().min(1, 'feeding.errors.itemRequired').max(60, 'feeding.errors.itemMax'),
  quantity: z
    .number({ message: 'feeding.errors.quantityNumber' })
    .int('feeding.errors.quantityNumber')
    .nonnegative('feeding.errors.quantityNonNegative')
    .nullable()
    .optional(),
  accepted: z.boolean(),
  notes: z.string().trim().max(300, 'feeding.errors.notesMax'),
})

export type FeedFormValues = z.infer<typeof feedFormSchema>
