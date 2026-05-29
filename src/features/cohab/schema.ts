import { z } from 'zod'

/**
 * Cohabitation (합사) compatibility verdicts.
 *
 * The ordering encodes severity, worst-first, because the overwhelming
 * majority of exotic pairings are unsafe:
 *  - `no`              → do not house together (almost every pair lands here)
 *  - `caution`         → strongly discouraged; only with expert setup / risk
 *  - `sameSpeciesOnly` → grouping is viable, but ONLY with the same species
 *  - `ok`              → social species that genuinely benefit from a group
 */
export const verdictSchema = z.enum(['no', 'caution', 'sameSpeciesOnly', 'ok'])
export type Verdict = z.infer<typeof verdictSchema>

export const VERDICTS: readonly Verdict[] = ['no', 'caution', 'sameSpeciesOnly', 'ok'] as const

/**
 * Result of a single compatibility check. `reasonCodes` are stable ids that map
 * to `cohab.reasons.<id>` i18n strings, so the verdict copy stays translatable
 * and the engine never returns user-facing text.
 */
export const cohabResultSchema = z.object({
  verdict: verdictSchema,
  reasonCodes: z.array(z.string()),
})
export type CohabResult = z.infer<typeof cohabResultSchema>

/**
 * Minimal species shape the engine reasons over. Kept narrow on purpose so the
 * pure rules are easy to unit-test without constructing a full `Species`.
 */
export interface CohabSpecies {
  slug: string
  category: string
  koreanName: string
}
