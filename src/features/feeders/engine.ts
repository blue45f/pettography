import type { FeederColony } from './schema'

/**
 * Pure, side-effect-free feeder-culture math.
 *
 * Date arithmetic is always done in UTC from a `YYYY-MM-DD` string so a "day"
 * is exactly 86_400_000 ms apart and the cadence never drifts across the user's
 * local timezone / DST.
 */

const MS_PER_DAY = 86_400_000

/** Feeders gut-loaded within this many days are still "fed recently". */
export const FEED_RECENTLY_DAYS = 3
/** Past this many days since the last gut-load the culture is "overdue". */
export const FEED_OVERDUE_DAYS = 7

/** Parse a `YYYY-MM-DD` day-date into a UTC Date at midnight. */
function toUtcDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`)
}

/**
 * Whole days from `dateISO` to `todayISO` (today − date). 0 on the same day,
 * negative when `dateISO` is in the future relative to today.
 */
export function daysSince(dateISO: string, todayISO: string): number {
  const diff = toUtcDate(todayISO).getTime() - toUtcDate(dateISO).getTime()
  return Math.round(diff / MS_PER_DAY)
}

/** Whole days the colony has existed, as a 1-based "N일차" age (start day = 1). */
export function colonyAgeDays(colony: FeederColony, todayISO: string): number {
  return daysSince(colony.startedAt, todayISO) + 1
}

export type FeedStatus = 'fedRecently' | 'feedSoon' | 'overdue' | 'never'

/**
 * Gut-load status from the last-fed date:
 * - `never`       — never gut-loaded (no date).
 * - `fedRecently` — within `FEED_RECENTLY_DAYS` (and not in the future).
 * - `feedSoon`    — due for a top-up but not yet overdue.
 * - `overdue`     — more than `FEED_OVERDUE_DAYS` since the last gut-load.
 *
 * A future last-fed date is treated as just-fed (clamped to `fedRecently`) so a
 * mis-entered date never reads as overdue.
 */
export function feedStatus(lastFedAt: string | null, todayISO: string): FeedStatus {
  if (!lastFedAt) return 'never'
  const days = daysSince(lastFedAt, todayISO)
  if (days <= FEED_RECENTLY_DAYS) return 'fedRecently'
  if (days <= FEED_OVERDUE_DAYS) return 'feedSoon'
  return 'overdue'
}

/** Sort weight by gut-load urgency: overdue first, never next, then soon, then fresh. */
const STATUS_URGENCY: Record<FeedStatus, number> = {
  overdue: 0,
  never: 1,
  feedSoon: 2,
  fedRecently: 3,
}

/**
 * Colonies ordered by gut-load urgency, then by name (locale-aware), then by id
 * for a stable tiebreak. Non-mutating.
 */
export function sortColonies(colonies: FeederColony[], todayISO: string): FeederColony[] {
  return [...colonies].sort((a, b) => {
    const ua = STATUS_URGENCY[feedStatus(a.lastFedAt, todayISO)]
    const ub = STATUS_URGENCY[feedStatus(b.lastFedAt, todayISO)]
    if (ua !== ub) return ua - ub
    const byName = a.name.localeCompare(b.name)
    if (byName !== 0) return byName
    return a.id.localeCompare(b.id)
  })
}
