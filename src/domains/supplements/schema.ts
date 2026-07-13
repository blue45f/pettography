import { z } from 'zod'

const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function localTodayIso(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

/**
 * The three dusting products keepers rotate to prevent metabolic bone disease
 * (MBD) in insectivorous/herbivorous exotics:
 *  - `calcium`     — plain calcium carbonate (no D3), used most feedings.
 *  - `calciumD3`   — calcium with vitamin D3, used sparingly (UVB reduces need).
 *  - `multivitamin`— a broad supplement, typically ~once weekly.
 */
export const supplementTypeSchema = z.enum(['calcium', 'calciumD3', 'multivitamin'])
export type SupplementType = z.infer<typeof supplementTypeSchema>

export const SUPPLEMENT_TYPES: readonly SupplementType[] = [
  'calcium',
  'calciumD3',
  'multivitamin',
] as const

/** A single recorded dusting event for one supplement type. */
export const dustingLogSchema = z.object({
  id: z.string(),
  petId: z.string(),
  speciesId: z.string().nullable(),
  type: supplementTypeSchema,
  /** Day the dusting happened, `YYYY-MM-DD`. */
  dustedAt: z.string(),
  note: z.string().max(200),
  createdAt: z.string(),
})
export type DustingLog = z.infer<typeof dustingLogSchema>

/**
 * Per-pet schedule override: how many days between dustings for each type.
 * Optional + persisted; when absent the page falls back to category defaults
 * from `data.ts`. A partial record so a keeper can tune a single type.
 */
export const scheduleConfigSchema = z.partialRecord(
  supplementTypeSchema,
  z.number().int().positive()
)
export type ScheduleConfig = z.infer<typeof scheduleConfigSchema>

/**
 * Quick-log + full-log form. Fields are required (RHF supplies defaults) to
 * avoid zod `.optional()`/`.default()` friction with the resolver; error
 * messages are i18n keys resolved by the page via `t(...)`.
 */
export const dustingFormSchema = z.object({
  type: supplementTypeSchema,
  dustedAt: z
    .string()
    .min(1, 'supplements.errors.dateRequired')
    .regex(ISO_DAY_PATTERN, 'supplements.errors.dateInvalid')
    .refine((value) => value <= localTodayIso(), 'supplements.errors.dateFuture'),
  note: z.string().trim().max(200, 'supplements.errors.noteMax'),
})
export type DustingFormValues = z.infer<typeof dustingFormSchema>
