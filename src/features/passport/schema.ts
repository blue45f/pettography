import { z } from 'zod'

/**
 * Achievement schema for the Pet Passport.
 *
 * Achievements are *derived* from activity the keeper already logged across
 * other features (diary, molt, feeding, breeding) plus the active pet's age.
 * Nothing here is persisted — definitions are static and every unlock is a pure
 * function of the aggregated metrics (see `engine.ts`).
 */

/**
 * A single countable signal aggregated from the active pet's logged activity.
 * Each achievement targets exactly one metric and compares it against a goal.
 * - daysTogether:          whole days since the pet's `createdAt`
 * - diaryCount:            number of diary entries
 * - moltCount:             number of shed/molt events
 * - completeShedCount:     molt events with kind `complete`
 * - feedingCount:          number of feeding logs
 * - feedingAcceptedStreak: most recent run of consecutive accepted feedings
 * - clutchCount:           number of egg clutches
 */
export const metricKeySchema = z.enum([
  'daysTogether',
  'diaryCount',
  'moltCount',
  'completeShedCount',
  'feedingCount',
  'feedingAcceptedStreak',
  'clutchCount',
])
export type MetricKey = z.infer<typeof metricKeySchema>

export const METRIC_KEYS: readonly MetricKey[] = [
  'daysTogether',
  'diaryCount',
  'moltCount',
  'completeShedCount',
  'feedingCount',
  'feedingAcceptedStreak',
  'clutchCount',
] as const

/** Visual rarity tier of an achievement. */
export const achievementTierSchema = z.enum(['bronze', 'silver', 'gold'])
export type AchievementTier = z.infer<typeof achievementTierSchema>

export const ACHIEVEMENT_TIERS: readonly AchievementTier[] = ['bronze', 'silver', 'gold'] as const

/**
 * A static achievement definition. Title/description are *not* stored here —
 * they resolve through i18n at `passport.ach.<id>.title` / `.desc` so the grid
 * stays fully localized.
 */
export const achievementDefSchema = z.object({
  id: z.string(),
  /** Emoji shown on the badge. */
  icon: z.string(),
  tier: achievementTierSchema,
  /** The metric value required to unlock (inclusive: `current >= goal`). */
  goal: z.number().int().positive(),
  metric: metricKeySchema,
})
export type AchievementDef = z.infer<typeof achievementDefSchema>

/** Result of evaluating one achievement against the current metrics. */
export interface AchievementProgress {
  def: AchievementDef
  unlocked: boolean
  /** Completion toward the goal, clamped to 0..100. */
  progress: number
  /** Raw current metric value (uncapped). */
  current: number
}

/**
 * Aggregated, side-effect-free input the engine derives the passport stats and
 * achievements from. Each list is already scoped to the active pet by the page;
 * the engine treats them as plain readonly arrays so it stays trivially
 * testable. `petCreatedAt` is the active pet's `createdAt` (ISO) or null.
 */
export interface PassportMetricInput {
  petCreatedAt: string | null
  diary: ReadonlyArray<{ occurredAt: string }>
  molts: ReadonlyArray<{ kind: string; occurredAt: string }>
  feedings: ReadonlyArray<{ fedAt: string; accepted: boolean }>
  clutches: ReadonlyArray<{ laidAt: string }>
}
