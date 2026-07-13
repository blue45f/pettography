import { z } from 'zod'

const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function localTodayIso(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

/**
 * Common stress / defensive signs an exotic may show during a handling
 * session. Each id maps to a label at `taming.signs.<id>`.
 * - fleeing:       trying to escape / run away
 * - hiding:        burrowing or seeking cover
 * - tailRattle:    tail rattling / vibrating (defensive display)
 * - hissing:       hissing / huffing
 * - biting:        biting or attempting to bite
 * - gaping:        open-mouth threat display
 * - freezing:      tonic immobility / frozen, not relaxed
 * - regurgitation: spitting up / regurgitating after handling
 */
export const stressSignSchema = z.enum([
  'fleeing',
  'hiding',
  'tailRattle',
  'hissing',
  'biting',
  'gaping',
  'freezing',
  'regurgitation',
])
export type StressSign = z.infer<typeof stressSignSchema>

export const STRESS_SIGNS: readonly StressSign[] = [
  'fleeing',
  'hiding',
  'tailRattle',
  'hissing',
  'biting',
  'gaping',
  'freezing',
  'regurgitation',
] as const

/** Calmness is a 1 (very stressed) .. 5 (relaxed) self-rating. */
export const CALMNESS_MIN = 1
export const CALMNESS_MAX = 5
export const CALMNESS_LEVELS: readonly number[] = [1, 2, 3, 4, 5] as const

export const handlingSessionSchema = z.object({
  id: z.string(),
  petId: z.string(),
  speciesId: z.string().nullable(),
  /** Day-precision date, YYYY-MM-DD. */
  sessionAt: z.string(),
  durationMin: z.number().int().nonnegative(),
  calmness: z.number().int().min(CALMNESS_MIN).max(CALMNESS_MAX),
  stressSigns: z.array(stressSignSchema),
  note: z.string().max(200),
  createdAt: z.string(),
})

export type HandlingSession = z.infer<typeof handlingSessionSchema>

export const handlingFormSchema = z.object({
  sessionAt: z
    .string()
    .min(1, 'taming.errors.dateRequired')
    .regex(ISO_DAY_PATTERN, 'taming.errors.dateInvalid')
    .refine((value) => value <= localTodayIso(), 'taming.errors.dateFuture'),
  durationMin: z
    .number({ message: 'taming.errors.durationNumber' })
    .int('taming.errors.durationNumber')
    .min(0, 'taming.errors.durationMin')
    .max(600, 'taming.errors.durationMax'),
  calmness: z
    .number({ message: 'taming.errors.calmnessRequired' })
    .int()
    .min(CALMNESS_MIN, 'taming.errors.calmnessRange')
    .max(CALMNESS_MAX, 'taming.errors.calmnessRange'),
  stressSigns: z.array(stressSignSchema),
  note: z.string().trim().max(200, 'taming.errors.noteMax'),
})

export type HandlingFormValues = z.infer<typeof handlingFormSchema>
