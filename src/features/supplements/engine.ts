import type { DustingLog, SupplementType } from './schema'

/**
 * Pure, side-effect-free analytics for the supplement dusting scheduler.
 *
 * Date math is always done in UTC from a `YYYY-MM-DD` string so a "day" is
 * exactly 86_400_000 ms — no local timezone / DST drift.
 */

const MS_PER_DAY = 86_400_000

/** Number of days before the due date at which a dusting counts as "soon". */
const SOON_WINDOW_DAYS = 1

/** Parse a `YYYY-MM-DD` day-date into a UTC Date at midnight. */
function toUtcDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`)
}

/** Whole-day difference `b - a` (can be negative). */
export function daysBetween(a: string, b: string): number {
  const diff = toUtcDate(b).getTime() - toUtcDate(a).getTime()
  return Math.round(diff / MS_PER_DAY)
}

/** Add `days` to a `YYYY-MM-DD` date, returning a `YYYY-MM-DD` string. */
export function addDays(iso: string, days: number): string {
  const next = new Date(toUtcDate(iso).getTime() + days * MS_PER_DAY)
  return next.toISOString().slice(0, 10)
}

/** Project the next dusting day-date from the last dusting plus the cadence. */
export function nextDusting(lastDustedISO: string, intervalDays: number): string {
  return addDays(lastDustedISO, intervalDays)
}

/**
 * Signed days from `today` to the next dusting (negative once overdue).
 * `today` defaults to the current UTC day so callers can omit it.
 */
export function daysUntil(
  dateISO: string,
  todayISO: string = new Date().toISOString().slice(0, 10),
): number {
  return daysBetween(todayISO, dateISO)
}

export type DustingStatusCode = 'due' | 'soon' | 'ok' | 'never'

/**
 * Status of a supplement type for `today`:
 *  - `never` — never dusted (no last date).
 *  - `due`   — the next dusting is today or overdue.
 *  - `soon`  — the next dusting is within `SOON_WINDOW_DAYS`.
 *  - `ok`    — comfortably ahead of the next dusting.
 *
 * A null/empty `lastDustedISO` always reports `never`, regardless of interval.
 */
export function dustingStatus(
  lastDustedISO: string | null | undefined,
  intervalDays: number,
  todayISO: string = new Date().toISOString().slice(0, 10),
): DustingStatusCode {
  if (!lastDustedISO) return 'never'
  const due = nextDusting(lastDustedISO, intervalDays)
  const delta = daysBetween(todayISO, due)
  if (delta <= 0) return 'due'
  if (delta <= SOON_WINDOW_DAYS) return 'soon'
  return 'ok'
}

/**
 * The most recent log of a given type, or null when none exists. Compares by
 * `dustedAt` (day-date), breaking ties with the later `createdAt` so two
 * dustings recorded for the same day resolve deterministically.
 */
export function latestByType(logs: DustingLog[], type: SupplementType): DustingLog | null {
  let latest: DustingLog | null = null
  for (const log of logs) {
    if (log.type !== type) continue
    if (latest === null) {
      latest = log
      continue
    }
    const byDay = log.dustedAt.localeCompare(latest.dustedAt)
    if (byDay > 0 || (byDay === 0 && log.createdAt.localeCompare(latest.createdAt) > 0)) {
      latest = log
    }
  }
  return latest
}

export interface DustingStats {
  total: number
  byType: Record<SupplementType, number>
  /** Most recent dusting date across all types, `YYYY-MM-DD`, or null. */
  lastDusted: string | null
}

/** Roll-up counts used by the page summary. */
export function dustingStats(logs: DustingLog[]): DustingStats {
  const byType: Record<SupplementType, number> = {
    calcium: 0,
    calciumD3: 0,
    multivitamin: 0,
  }
  let lastDusted: string | null = null
  for (const log of logs) {
    byType[log.type] += 1
    if (lastDusted === null || log.dustedAt.localeCompare(lastDusted) > 0) {
      lastDusted = log.dustedAt
    }
  }
  return { total: logs.length, byType, lastDusted }
}
