import { z } from 'zod'

/**
 * Feeder culture tracker schemas.
 *
 * Keeper-level (global) data: cultures of feeder insects and bioactive cleanup
 * crews serve every pet in the household, so colonies are NOT scoped to a pet
 * and carry no `petId`.
 */

export const feederTypeSchema = z.enum([
  'dubia',
  'cricket',
  'mealworm',
  'superworm',
  'isopod',
  'springtail',
  'other',
])
export type FeederType = z.infer<typeof feederTypeSchema>

export const FEEDER_TYPES: readonly FeederType[] = [
  'dubia',
  'cricket',
  'mealworm',
  'superworm',
  'isopod',
  'springtail',
  'other',
] as const

export const feederColonySchema = z.object({
  id: z.string(),
  type: feederTypeSchema,
  name: z.string().max(60),
  /** Culture start date, `YYYY-MM-DD`. */
  startedAt: z.string(),
  /** Rough head-count estimate, or null when unknown. */
  estimateCount: z.number().int().nonnegative().nullable(),
  /** Last gut-load / "fed the feeders" date, `YYYY-MM-DD`, or null when never. */
  lastFedAt: z.string().nullable(),
  notes: z.string().max(300),
  createdAt: z.string(),
})
export type FeederColony = z.infer<typeof feederColonySchema>

/**
 * Add/edit form. Fields are required (with RHF defaults supplied by the page)
 * to avoid zod `.optional()`/`.default()` friction with the resolver; the
 * estimate is modelled as a string the page coerces, so an empty box maps to a
 * null head-count rather than a validation error.
 */
export const feederFormSchema = z.object({
  type: feederTypeSchema,
  name: z.string().trim().min(1, 'feeders.errors.nameRequired').max(60, 'feeders.errors.nameMax'),
  startedAt: z.string().min(1, 'feeders.errors.startedAtRequired'),
  estimateCount: z
    .number({ message: 'feeders.errors.estimateNumber' })
    .int('feeders.errors.estimateInt')
    .nonnegative('feeders.errors.estimateNonnegative')
    .nullable(),
  notes: z.string().trim().max(300, 'feeders.errors.notesMax'),
})
export type FeederFormValues = z.infer<typeof feederFormSchema>
