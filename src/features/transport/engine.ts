import { MS_PER_DAY, toUtcDate } from '@utils/date'

import type { Trip } from './schema'

/**
 * Pure, side-effect-free helpers for the transport planner. Date math is done
 * in UTC (UTC day primitives live in `@utils/date`) so a trip's D-day never
 * drifts with the runner's local timezone.
 */

export interface ChecklistProgress {
  done: number
  total: number
  /** Completion percentage, integer, clamped to 0..100. */
  pct: number
}

/** Trip lifecycle relative to "today". */
export type TripStatusCode = 'upcoming' | 'today' | 'past'

/** UTC-midnight epoch ms for a `YYYY-MM-DD` (or ISO) day-date. */
function toUtcDay(dateISO: string): number {
  return toUtcDate(dateISO).getTime()
}

/**
 * How many of `allItemIds` are checked on `trip`. Unknown keys in the trip's
 * checklist (e.g. items dropped from a later catalog) are ignored — only the
 * ids passed in are counted, so progress stays meaningful across versions.
 */
export function checklistProgress(
  trip: Pick<Trip, 'checklist'>,
  allItemIds: readonly string[]
): ChecklistProgress {
  const total = allItemIds.length
  let done = 0
  for (const id of allItemIds) {
    if (trip.checklist[id]) done += 1
  }
  if (total <= 0) return { done: 0, total: 0, pct: 0 }
  const pct = Math.min(100, Math.max(0, Math.round((done / total) * 100)))
  return { done, total, pct }
}

/**
 * Whole-day delta from `todayISO` to `dateISO`. Positive = in the future,
 * 0 = today, negative = in the past.
 */
export function daysUntil(dateISO: string, todayISO: string): number {
  return Math.round((toUtcDay(dateISO) - toUtcDay(todayISO)) / MS_PER_DAY)
}

/** Classifies a trip's date relative to today. */
export function tripStatusCode(trip: Pick<Trip, 'date'>, todayISO: string): TripStatusCode {
  const delta = daysUntil(trip.date, todayISO)
  if (delta > 0) return 'upcoming'
  if (delta === 0) return 'today'
  return 'past'
}

/**
 * Returns a new array sorted for display: upcoming/today trips first with the
 * soonest date leading, then past trips most-recent first. `todayISO` decides
 * the boundary; ties break on `createdAt` (newest first) for stability.
 */
export function sortTrips(trips: readonly Trip[], todayISO: string): Trip[] {
  return [...trips].sort((a, b) => {
    const da = daysUntil(a.date, todayISO)
    const db = daysUntil(b.date, todayISO)
    const aPast = da < 0
    const bPast = db < 0
    if (aPast !== bPast) return aPast ? 1 : -1
    if (aPast) {
      // both past: most recent (largest, i.e. closest to 0) first
      if (db !== da) return db - da
    } else {
      // both upcoming/today: soonest first
      if (da !== db) return da - db
    }
    return b.createdAt.localeCompare(a.createdAt)
  })
}
