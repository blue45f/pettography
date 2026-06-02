/**
 * Shared UTC day-date math for the care engines.
 *
 * Every helper works on a `YYYY-MM-DD` day-date and does its arithmetic in UTC
 * so a "day" is exactly 86_400_000 ms apart and schedules / countdowns never
 * drift across the user's local timezone or DST. This UTC pinning is a
 * deliberate contract — keep these pure and timezone-anchored.
 */

/** Milliseconds in one UTC day. */
export const MS_PER_DAY = 86_400_000

/** Parse a `YYYY-MM-DD` (or ISO) day-date into a UTC Date at midnight. */
export function toUtcDate(iso: string): Date {
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
