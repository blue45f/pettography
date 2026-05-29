import type { GearItem } from './schema'

/**
 * Gear lifecycle math lives here as pure, side-effect-free functions so the
 * countdown logic stays easy to reason about and exhaustively testable.
 *
 * All date math is done in UTC from `YYYY-MM-DD` day-dates to avoid local
 * timezone / DST drift: a "day" is exactly 86_400_000 ms.
 *
 * An `intervalMonths` of 0 means "no scheduled replacement" — the item is
 * monitor-only, so `dueDate` / `daysUntilDue` / `lifePct` all return null and
 * `gearStatus` reports `'monitor'`.
 */

const MS_PER_DAY = 86_400_000

/** Days within `soon` warning range, inclusive. */
export const SOON_THRESHOLD_DAYS = 14

export type GearStatus = 'ok' | 'soon' | 'overdue' | 'monitor'

/** Parse a `YYYY-MM-DD` day-date into a UTC Date at midnight. */
function toUtcDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`)
}

/** Whole-day difference `b - a` (can be negative). */
function daysBetween(a: string, b: string): number {
  return Math.round((toUtcDate(b).getTime() - toUtcDate(a).getTime()) / MS_PER_DAY)
}

/**
 * Add `months` to a `YYYY-MM-DD` date, clamping the day-of-month when the
 * target month is shorter. e.g. 2024-01-31 + 1mo -> 2024-02-29 (leap),
 * 2023-01-31 + 1mo -> 2023-02-28.
 */
export function addMonths(iso: string, months: number): string {
  const base = toUtcDate(iso)
  const year = base.getUTCFullYear()
  const month = base.getUTCMonth()
  const day = base.getUTCDate()

  const targetMonthIndex = month + months
  const targetYear = year + Math.floor(targetMonthIndex / 12)
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12

  // Day 0 of the *next* month is the last day of the target month, giving us
  // the clamp ceiling (28/29/30/31) without hand-rolling a calendar.
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate()
  const clampedDay = Math.min(day, lastDayOfTargetMonth)

  return new Date(Date.UTC(targetYear, normalizedMonth, clampedDay)).toISOString().slice(0, 10)
}

/**
 * Scheduled replacement date for an item: `installedAt + intervalMonths`.
 * Returns null when the interval is 0 (monitor-only, no scheduled replacement).
 */
export function dueDate(item: GearItem): string | null {
  if (item.intervalMonths <= 0) return null
  return addMonths(item.installedAt, item.intervalMonths)
}

/**
 * Signed whole days from `todayISO` to the due date (negative once overdue).
 * Returns null for monitor-only items.
 */
export function daysUntilDue(item: GearItem, todayISO: string): number | null {
  const due = dueDate(item)
  if (due === null) return null
  return daysBetween(todayISO, due)
}

/**
 * Lifecycle status for an item as of `todayISO`:
 * - `monitor`  — no scheduled replacement (interval 0)
 * - `overdue`  — past the due date
 * - `soon`     — due within {@link SOON_THRESHOLD_DAYS} days
 * - `ok`       — due further out
 */
export function gearStatus(item: GearItem, todayISO: string): GearStatus {
  const days = daysUntilDue(item, todayISO)
  if (days === null) return 'monitor'
  if (days < 0) return 'overdue'
  if (days <= SOON_THRESHOLD_DAYS) return 'soon'
  return 'ok'
}

/**
 * Percent of the replacement interval elapsed as of `todayISO`, clamped to
 * 0..100. Returns null for monitor-only items.
 */
export function lifePct(item: GearItem, todayISO: string): number | null {
  const due = dueDate(item)
  if (due === null) return null
  const totalDays = daysBetween(item.installedAt, due)
  if (totalDays <= 0) return 100
  const elapsed = daysBetween(item.installedAt, todayISO)
  const pct = (elapsed / totalDays) * 100
  return Math.min(Math.max(pct, 0), 100)
}

/** Rank used to order gear by urgency: overdue first, monitor-only last. */
const STATUS_RANK: Record<GearStatus, number> = {
  overdue: 0,
  soon: 1,
  ok: 2,
  monitor: 3,
}

/**
 * Sort gear by urgency (overdue -> soon -> ok -> monitor). Within the same
 * status, the soonest due date wins; monitor-only items fall back to name.
 * Non-mutating and stable for items that compare equal.
 */
export function sortByUrgency(items: GearItem[], todayISO: string): GearItem[] {
  return [...items].sort((a, b) => {
    const rankDiff = STATUS_RANK[gearStatus(a, todayISO)] - STATUS_RANK[gearStatus(b, todayISO)]
    if (rankDiff !== 0) return rankDiff

    const daysA = daysUntilDue(a, todayISO)
    const daysB = daysUntilDue(b, todayISO)
    if (daysA !== null && daysB !== null && daysA !== daysB) return daysA - daysB

    return a.name.localeCompare(b.name)
  })
}
