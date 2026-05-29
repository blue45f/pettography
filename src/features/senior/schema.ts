import { z } from 'zod'

/** Coarse life stage derived from age relative to species lifespan. */
export const lifeStageSchema = z.enum(['juvenile', 'adult', 'senior', 'geriatric'])
export type LifeStage = z.infer<typeof lifeStageSchema>

export const LIFE_STAGES: readonly LifeStage[] = [
  'juvenile',
  'adult',
  'senior',
  'geriatric',
] as const

/** How the keeper obtained the animal — refines an unknown hatch/birth date. */
export const acquiredAsSchema = z.enum(['baby', 'juvenile', 'adult', 'unknown'])
export type AcquiredAs = z.infer<typeof acquiredAsSchema>

export const ACQUIRED_AS_OPTIONS: readonly AcquiredAs[] = [
  'baby',
  'juvenile',
  'adult',
  'unknown',
] as const

/**
 * One persisted senior-care record per pet. `checklist` maps a
 * {@link SENIOR_CHECKLIST} item id to its completion flag; missing ids are
 * treated as unchecked.
 */
export const seniorProfileSchema = z.object({
  petId: z.string(),
  ageMonths: z.number().int().nonnegative().nullable(),
  acquiredAs: acquiredAsSchema,
  checklist: z.record(z.string(), z.boolean()),
  notes: z.string().max(300),
  updatedAt: z.string(),
})

export type SeniorProfile = z.infer<typeof seniorProfileSchema>

/** Largest age (in years) the form accepts — guards against fat-finger entries. */
export const MAX_AGE_YEARS = 120

/**
 * Age is captured in years (one decimal is fine, e.g. 4.5) and persisted as
 * whole months. Required field with an RHF default to avoid resolver friction.
 */
export const seniorFormSchema = z.object({
  ageYears: z
    .number({ message: 'senior.errors.ageNumber' })
    .nonnegative('senior.errors.ageNonNegative')
    .max(MAX_AGE_YEARS, 'senior.errors.ageMax'),
  acquiredAs: acquiredAsSchema,
  notes: z.string().trim().max(300, 'senior.errors.notesMax'),
})

export type SeniorFormValues = z.infer<typeof seniorFormSchema>
