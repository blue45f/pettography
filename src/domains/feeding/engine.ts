import { addDays, daysBetween } from '@utils/date'

import type { FeedingRule } from './data'
import type { AgeStage, FeedLog } from './schema'

/**
 * All feeding analytics live here as pure, side-effect-free functions so the
 * scheduler stays easy to reason about and exhaustively testable.
 *
 * Date math is always done in UTC from a `YYYY-MM-DD` string to avoid local
 * timezone / DST drift: a "day" is exactly 86_400_000 ms apart. The UTC day
 * primitives (`addDays`, `daysBetween`) live in `@utils/date`.
 */

// Re-exported so existing `@domains/feeding` consumers keep their date helpers.
export { addDays, daysBetween }

/** Prey weight as a fraction of snake body weight (rule of thumb: 10–15%). */
const SNAKE_PREY_MIN_PCT = 0.1
const SNAKE_PREY_MAX_PCT = 0.15

/** Recommended cadence in days for the given life stage. */
export function recommendFrequencyDays(rule: FeedingRule, ageStage: AgeStage): number {
  return ageStage === 'juvenile' ? rule.frequencyDaysJuvenile : rule.frequencyDaysAdult
}

/** Project the next feeding date from the last feeding plus the cadence. */
export function nextFeedingDate(lastFedISO: string, freqDays: number): string {
  return addDays(lastFedISO, freqDays)
}

/**
 * Signed days from `today` to the next feeding (negative once overdue).
 * `today` defaults to the current UTC day so callers can omit it.
 */
export function daysUntilFeeding(
  lastFedISO: string,
  freqDays: number,
  today: string = new Date().toISOString().slice(0, 10)
): number {
  return daysBetween(today, nextFeedingDate(lastFedISO, freqDays))
}

export interface PreyWeightRange {
  minPreyG: number
  maxPreyG: number
}

/**
 * Recommended prey weight for a constrictor snake: 10–15% of body weight.
 * Rounded to whole grams; clamps negatives to zero for defensive callers.
 */
export function recommendPreyForSnake(bodyWeightG: number): PreyWeightRange {
  const safeWeight = Number.isFinite(bodyWeightG) && bodyWeightG > 0 ? bodyWeightG : 0
  return {
    minPreyG: Math.round(safeWeight * SNAKE_PREY_MIN_PCT),
    maxPreyG: Math.round(safeWeight * SNAKE_PREY_MAX_PCT),
  }
}

/** Logs sorted descending by `fedAt` (most recent first). Non-mutating. */
export function sortByFedDesc(logs: FeedLog[]): FeedLog[] {
  return [...logs].sort((a, b) => b.fedAt.localeCompare(a.fedAt))
}

/**
 * Count of the most recent consecutive refusals (`accepted === false`).
 * Logs are sorted descending by `fedAt` first, so the streak is measured from
 * the latest feeding backwards and breaks at the first accepted feeding.
 */
export function refusalStreak(logs: FeedLog[]): number {
  const sorted = sortByFedDesc(logs)
  let streak = 0
  for (const log of sorted) {
    if (log.accepted) break
    streak += 1
  }
  return streak
}

export interface FeedingStats {
  total: number
  acceptedCount: number
  refusedCount: number
  /** Most recent feeding date, `YYYY-MM-DD`, or null when none logged. */
  lastFed: string | null
}

/** Roll-up counts used by the page header / summary. */
export function feedingStats(logs: FeedLog[]): FeedingStats {
  const sorted = sortByFedDesc(logs)
  return {
    total: logs.length,
    acceptedCount: logs.filter((l) => l.accepted).length,
    refusedCount: logs.filter((l) => !l.accepted).length,
    lastFed: sorted.length > 0 ? sorted[0].fedAt : null,
  }
}
