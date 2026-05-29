import { z } from 'zod'

/** Body Condition Score is a 1..5 integer scale (1 emaciated … 5 obese). */
export const BCS_SCORES: readonly number[] = [1, 2, 3, 4, 5] as const

export const bcsEntrySchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  speciesId: z.string().nullable(),
  assessedAt: z.string(),
  score: z.number().int().min(1).max(5),
  note: z.string().max(200),
  createdAt: z.string(),
})

export type BcsEntry = z.infer<typeof bcsEntrySchema>

/**
 * Log form. The segmented control sets `score` as a number via `setValue`, so
 * it stays numeric in the form layer; required + RHF defaults avoid resolver
 * friction with `.optional()`/`.default()` and keep input/output types aligned.
 */
export const bcsFormSchema = z.object({
  assessedAt: z.string().min(1, 'bcs.errors.dateRequired'),
  score: z
    .number({ message: 'bcs.errors.scoreRequired' })
    .int('bcs.errors.scoreRange')
    .min(1, 'bcs.errors.scoreRange')
    .max(5, 'bcs.errors.scoreRange'),
  note: z.string().trim().max(200, 'bcs.errors.noteMax'),
})

export type BcsFormValues = z.infer<typeof bcsFormSchema>
