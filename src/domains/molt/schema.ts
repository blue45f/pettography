import { z } from 'zod'

/**
 * The kind of a logged shed/molt event.
 * - complete:    a clean, full shed/molt
 * - incomplete:  shed came off in pieces / partial
 * - stuck:       retained shed (dysecdysis) needing intervention
 * - in_progress: currently in the pre-shed / molting window (not a finished cycle)
 */
export const moltKindSchema = z.enum(['complete', 'incomplete', 'stuck', 'in_progress'])
export type MoltKind = z.infer<typeof moltKindSchema>

export const MOLT_KINDS: readonly MoltKind[] = [
  'complete',
  'incomplete',
  'stuck',
  'in_progress',
] as const

export const moltEventSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  speciesId: z.string().nullable(),
  /** Day-precision date, YYYY-MM-DD. */
  occurredAt: z.string(),
  kind: moltKindSchema,
  notes: z.string().max(300),
  createdAt: z.string(),
})

export type MoltEvent = z.infer<typeof moltEventSchema>

export const moltFormSchema = z.object({
  occurredAt: z.string().min(1, 'molt.errors.dateRequired'),
  kind: moltKindSchema,
  notes: z.string().trim().max(300, 'molt.errors.notesMax'),
})

export type MoltFormValues = z.infer<typeof moltFormSchema>
