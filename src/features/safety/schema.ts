import { z } from 'zod'

/**
 * Enclosure safety audit — persisted state.
 *
 * It is a checklist, so there is no edit form: just a per-pet map of checked
 * item ids. `audits` is keyed by pet id, with the literal key `'default'` used
 * when no pet is active. Every inner key is a checklist item id (see
 * `SAFETY_ITEMS`) → whether the keeper has confirmed it.
 *
 * These schemas are exported for type inference and possible validation of
 * rehydrated storage; the store itself works on the plain inferred types.
 */

/** Map of checklist item id → confirmed? for a single pet. */
export const auditMapSchema = z.record(z.string(), z.boolean())

export type AuditMap = z.infer<typeof auditMapSchema>

/** Persisted shape for the safety store: pet key → that pet's audit map. */
export const safetyStateSchema = z.object({
  audits: z.record(z.string(), auditMapSchema),
})

export type SafetyState = z.infer<typeof safetyStateSchema>

/** Pet key used when no pet is active. */
export const DEFAULT_PET_KEY = 'default' as const

/** The three safety levels derived from audit completion. */
export const safetyLevelSchema = z.enum(['low', 'medium', 'high'])

export type SafetyLevel = z.infer<typeof safetyLevelSchema>

export const SAFETY_LEVELS: readonly SafetyLevel[] = ['low', 'medium', 'high'] as const
