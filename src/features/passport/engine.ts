import type { AchievementDef, AchievementProgress, MetricKey, PassportMetricInput } from './schema'

/**
 * Pure passport analytics: stat aggregation, the achievement catalogue, and the
 * unlock/progress evaluator. Everything here is side-effect free so the page
 * can derive it all inside `useMemo` and the rules stay exhaustively testable.
 *
 * Date math is done in UTC from a `YYYY-MM-DD` string to avoid local timezone /
 * DST drift: a "day" is exactly 86_400_000 ms apart. Callers pass `todayISO`
 * in so "days together" is deterministic in tests.
 */

const MS_PER_DAY = 86_400_000

/** Parse a `YYYY-MM-DD` (or ISO) day-date into a UTC Date at midnight. */
function toUtcDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`)
}

/** Whole-day difference `b - a` (never negative; clamped at 0). */
function wholeDaysBetween(a: string, b: string): number {
  const diff = toUtcDate(b).getTime() - toUtcDate(a).getTime()
  return Math.max(0, Math.round(diff / MS_PER_DAY))
}

/**
 * The most recent run of consecutive accepted feedings. Feedings are ordered
 * by date descending first, so the streak is measured from the latest feeding
 * backwards and breaks at the first refusal (`accepted === false`).
 */
function feedingAcceptedStreak(feedings: PassportMetricInput['feedings']): number {
  const sorted = [...feedings].sort((a, b) => b.fedAt.localeCompare(a.fedAt))
  let streak = 0
  for (const log of sorted) {
    if (!log.accepted) break
    streak += 1
  }
  return streak
}

/**
 * Aggregate the per-metric counts the passport card and achievements read from.
 * Pure: `todayISO` is injected so `daysTogether` is deterministic. Guards every
 * field so empty input yields all-zero metrics.
 */
export function computeMetrics(
  input: PassportMetricInput,
  todayISO: string = new Date().toISOString().slice(0, 10),
): Record<MetricKey, number> {
  const { petCreatedAt, diary, molts, feedings, clutches, weights, bcs, vitals, water, growth } =
    input

  const daysTogether = petCreatedAt ? wholeDaysBetween(petCreatedAt, todayISO) : 0
  const completeShedCount = molts.filter((m) => m.kind === 'complete').length

  return {
    daysTogether,
    diaryCount: diary.length,
    moltCount: molts.length,
    completeShedCount,
    feedingCount: feedings.length,
    feedingAcceptedStreak: feedingAcceptedStreak(feedings),
    clutchCount: clutches.length,
    weightCount: weights.length,
    bcsCount: bcs.length,
    vitalsCount: vitals.length,
    waterCount: water.length,
    growthCount: growth.length,
  }
}

/**
 * The achievement catalogue. ~10 milestones spanning longevity, journaling,
 * shedding, feeding consistency and breeding. Titles/descriptions live in i18n
 * at `passport.ach.<id>.title` / `.desc`. Tiers escalate with the goal so the
 * grid reads bronze → silver → gold within a theme.
 */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // Longevity — days since the pet joined.
  { id: 'bond7', icon: '🌱', tier: 'bronze', goal: 7, metric: 'daysTogether' },
  { id: 'bond30', icon: '🌿', tier: 'silver', goal: 30, metric: 'daysTogether' },
  { id: 'bond100', icon: '🌳', tier: 'gold', goal: 100, metric: 'daysTogether' },
  // Journaling — diary entries logged.
  { id: 'diary1', icon: '📖', tier: 'bronze', goal: 1, metric: 'diaryCount' },
  { id: 'diary10', icon: '📚', tier: 'silver', goal: 10, metric: 'diaryCount' },
  { id: 'diary50', icon: '✍️', tier: 'gold', goal: 50, metric: 'diaryCount' },
  // Shedding / molting.
  { id: 'molt1', icon: '🍃', tier: 'bronze', goal: 1, metric: 'moltCount' },
  { id: 'moltMaster', icon: '🦋', tier: 'gold', goal: 5, metric: 'completeShedCount' },
  // Feeding.
  { id: 'feed10', icon: '🍽️', tier: 'bronze', goal: 10, metric: 'feedingCount' },
  { id: 'feed50', icon: '🍴', tier: 'silver', goal: 50, metric: 'feedingCount' },
  { id: 'feedStreak5', icon: '🔥', tier: 'silver', goal: 5, metric: 'feedingAcceptedStreak' },
  // Breeding.
  { id: 'clutch1', icon: '🥚', tier: 'gold', goal: 1, metric: 'clutchCount' },
  // Precision care — weight, body condition, vitals, water, growth.
  { id: 'weight1', icon: '🪶', tier: 'bronze', goal: 1, metric: 'weightCount' },
  { id: 'weight20', icon: '📊', tier: 'silver', goal: 20, metric: 'weightCount' },
  { id: 'bcs1', icon: '⚖️', tier: 'bronze', goal: 1, metric: 'bcsCount' },
  { id: 'vitals1', icon: '🫀', tier: 'bronze', goal: 1, metric: 'vitalsCount' },
  { id: 'water5', icon: '💧', tier: 'silver', goal: 5, metric: 'waterCount' },
  { id: 'growth5', icon: '📈', tier: 'silver', goal: 5, metric: 'growthCount' },
] as const

/** Percentage (0..100, rounded) of `current` toward `goal`, clamped. */
function progressPct(current: number, goal: number): number {
  if (goal <= 0) return 100
  const pct = (current / goal) * 100
  return Math.min(100, Math.max(0, Math.round(pct)))
}

/**
 * Evaluate every achievement against the aggregated metrics. Returns one row
 * per definition with its unlock state, clamped progress and raw current value.
 * Unlocked achievements are sorted first; ties keep catalogue order so the grid
 * is stable. Empty metrics → every row locked at 0% (current 0).
 */
export function evaluateAchievements(metrics: Record<MetricKey, number>): AchievementProgress[] {
  const rows = ACHIEVEMENTS.map((def) => {
    const current = metrics[def.metric] ?? 0
    return {
      def,
      current,
      unlocked: current >= def.goal,
      progress: progressPct(current, def.goal),
    }
  })

  // Stable sort: unlocked first, otherwise preserve catalogue order.
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      if (a.row.unlocked !== b.row.unlocked) return a.row.unlocked ? -1 : 1
      return a.index - b.index
    })
    .map(({ row }) => row)
}

/** Count of unlocked achievements — used for the passport summary line. */
export function unlockedCount(rows: AchievementProgress[]): number {
  return rows.filter((r) => r.unlocked).length
}

/**
 * A short, deterministic passport number derived from the pet id (no RNG so it
 * is stable across renders and reloads). Format: `PG-XXXX` where `XXXX` is a
 * base-36, zero-padded hash of the id. Falls back to `0000` for an empty id.
 */
export function passportNumber(petId: string | null | undefined): string {
  if (!petId) return 'PG-0000'
  let hash = 0
  for (let i = 0; i < petId.length; i += 1) {
    hash = (hash * 31 + petId.charCodeAt(i)) >>> 0
  }
  const code = (hash % 36 ** 4).toString(36).toUpperCase().padStart(4, '0')
  return `PG-${code}`
}
