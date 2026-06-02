import { MS_PER_DAY, addDays, toUtcDate } from '@utils/date'

import type { CleaningLog, CleanType } from './schema'

/**
 * Pure, side-effect-free cleaning analytics. Date math is always done in UTC
 * from a `YYYY-MM-DD` day-date so local timezone / DST never shifts a "day":
 * one day is exactly 86_400_000 ms (UTC day primitives live in `@utils/date`).
 */

/** "Soon" window: a clean within this many days of due is flagged early. */
export const SOON_WINDOW_DAYS = 2

export type CleanStatus = 'due' | 'soon' | 'ok' | 'never'

/**
 * The most recent log of a given clean type, or null when none exist.
 * Compares on the `cleanedAt` day-date (most recent wins).
 */
export function latestByType(logs: CleaningLog[], type: CleanType): CleaningLog | null {
  let latest: CleaningLog | null = null
  for (const log of logs) {
    if (log.type !== type) continue
    if (!latest || log.cleanedAt.localeCompare(latest.cleanedAt) > 0) latest = log
  }
  return latest
}

/** Project the next-due date from the last clean plus the interval. */
export function nextDue(lastCleanedISO: string, intervalDays: number): string {
  return addDays(lastCleanedISO, intervalDays)
}

/**
 * Signed whole-day difference from `todayISO` to `dateISO` (negative once the
 * date is in the past). `todayISO` defaults to the current UTC day.
 */
export function daysUntil(
  dateISO: string,
  todayISO: string = new Date().toISOString().slice(0, 10),
): number {
  const diff = toUtcDate(dateISO).getTime() - toUtcDate(todayISO).getTime()
  return Math.round(diff / MS_PER_DAY)
}

/**
 * Hygiene status for a clean type:
 * - `never` when nothing has been logged yet.
 * - `due`  when the next clean is today or overdue (daysUntil <= 0).
 * - `soon` when due within `SOON_WINDOW_DAYS`.
 * - `ok`   otherwise.
 */
export function cleanStatus(
  lastCleanedISO: string | null,
  intervalDays: number,
  todayISO: string = new Date().toISOString().slice(0, 10),
): CleanStatus {
  if (!lastCleanedISO) return 'never'
  const due = nextDue(lastCleanedISO, intervalDays)
  const left = daysUntil(due, todayISO)
  if (left <= 0) return 'due'
  if (left <= SOON_WINDOW_DAYS) return 'soon'
  return 'ok'
}

export interface CleaningStats {
  total: number
  byType: Record<CleanType, number>
  /** Most recent clean of any type, `YYYY-MM-DD`, or null when none logged. */
  lastCleaned: string | null
}

/** Roll-up counts used by the page header / summary. Non-mutating. */
export function cleaningStats(logs: CleaningLog[]): CleaningStats {
  const byType: Record<CleanType, number> = { spot: 0, full: 0, substrate: 0, water: 0 }
  let lastCleaned: string | null = null
  for (const log of logs) {
    byType[log.type] += 1
    if (!lastCleaned || log.cleanedAt.localeCompare(lastCleaned) > 0) lastCleaned = log.cleanedAt
  }
  return { total: logs.length, byType, lastCleaned }
}
