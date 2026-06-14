import { addDays, daysBetween } from '@utils/date'

import type { Medication, Quarantine } from './schema'

/**
 * Pure, side-effect-free analytics for the Medication & Quarantine tracker.
 *
 * Date math is always done in UTC from a `YYYY-MM-DD` string so a "day" is
 * exactly 86_400_000 ms — no local timezone / DST drift. The UTC day
 * primitives (`addDays`, `daysBetween`) live in `@utils/date`.
 */

// Re-exported so existing `@domains/meds` consumers keep their date helpers.
export { addDays, daysBetween }

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

/* ------------------------------------------------------------------ */
/* Medications                                                         */
/* ------------------------------------------------------------------ */

/**
 * Day-date the course ends (inclusive of the final dosing day), or null for an
 * open-ended course. With `durationDays = D` the course spans `[startedAt,
 * startedAt + D - 1]`, i.e. D calendar days.
 */
export function courseEndDate(med: Medication): string | null {
  if (med.durationDays === null) return null
  return addDays(med.startedAt, med.durationDays - 1)
}

/**
 * Every scheduled dose day-date for the course, ascending. Doses step from
 * `startedAt` by `frequencyDays`. Open-ended courses (no duration) are capped
 * to the doses up to and including `todayISO` plus one upcoming dose, so the
 * list stays finite without losing the "next" date.
 */
export function scheduledDoseDates(med: Medication, todayISO: string): string[] {
  const step = Math.max(1, Math.floor(med.frequencyDays))
  const end = courseEndDate(med)
  const dates: string[] = []
  for (let i = 0; ; i += 1) {
    const date = addDays(med.startedAt, i * step)
    if (end !== null) {
      if (daysBetween(date, end) < 0) break
    } else if (daysBetween(date, todayISO) < 0) {
      // First dose strictly after today — keep it as the single upcoming one.
      dates.push(date)
      break
    }
    dates.push(date)
    // Hard guard so a degenerate input can never spin forever.
    if (i > 100_000) break
  }
  return dates
}

/**
 * The next dose to act on for `today`: the earliest scheduled dose that has not
 * yet been recorded as given. A scheduled date in the past surfaces as the
 * (overdue) actionable dose; a date equal to today is due; a future date is
 * upcoming. Returns null once every scheduled dose has been given, or once the
 * course's final day has passed (a finished course has no actionable dose).
 */
export function nextDoseDate(med: Medication, todayISO: string): string | null {
  const end = courseEndDate(med)
  // Course's final dosing day is in the past → the course is finished.
  if (end !== null && daysBetween(end, todayISO) > 0) return null

  const scheduled = scheduledDoseDates(med, todayISO)
  for (const date of scheduled) {
    if (!isDoseGiven(med, date)) return date
  }
  return null
}

export type DoseStatusCode = 'dueToday' | 'overdue' | 'upcoming' | 'done'

/** Adherence-aware status of the next dose for `today`. */
export function doseStatusCode(med: Medication, todayISO: string): DoseStatusCode {
  const next = nextDoseDate(med, todayISO)
  if (next === null) return 'done'
  const delta = daysBetween(todayISO, next)
  if (delta === 0) return 'dueToday'
  if (delta < 0) return 'overdue'
  return 'upcoming'
}

/**
 * Course completion 0..100 based on elapsed days vs. duration. Open-ended
 * courses (no duration) return 0 since there is no finish line to measure
 * against.
 */
export function courseProgress(med: Medication, todayISO: string): number {
  if (med.durationDays === null || med.durationDays <= 0) return 0
  const elapsed = daysBetween(med.startedAt, todayISO) + 1
  return clampPercent((elapsed / med.durationDays) * 100)
}

/** Whether a dose was recorded as given for a specific day-date. */
export function isDoseGiven(med: Medication, dateISO: string): boolean {
  const day = dateISO.slice(0, 10)
  return med.doses.some((d) => d.date === day && d.given)
}

/** Doses recorded as given, sorted newest-first. */
export function givenDoses(med: Medication): string[] {
  return med.doses
    .filter((d) => d.given)
    .map((d) => d.date)
    .sort((a, b) => b.localeCompare(a))
}

/* ------------------------------------------------------------------ */
/* Quarantine                                                          */
/* ------------------------------------------------------------------ */

/** Day-date the quarantine is scheduled to end (inclusive final day). */
export function quarantineEndDate(q: Quarantine): string {
  return addDays(q.startedAt, q.durationDays - 1)
}

/**
 * Whole days remaining until the quarantine end (0 once the end day is reached
 * or passed). A freshly started 30-day quarantine reports 30 on day one.
 */
export function quarantineDaysRemaining(q: Quarantine, todayISO: string): number {
  const remaining = daysBetween(todayISO, q.startedAt) + q.durationDays
  return Math.max(0, remaining)
}

/** Quarantine elapsed completion 0..100. */
export function quarantineProgress(q: Quarantine, todayISO: string): number {
  if (q.durationDays <= 0) return 100
  const elapsed = daysBetween(q.startedAt, todayISO) + 1
  return clampPercent((elapsed / q.durationDays) * 100)
}

export type QuarantineDoneCode = 'active' | 'readyToClear' | 'cleared'

/** Lifecycle status of a quarantine for `today`. */
export function quarantineDoneCode(q: Quarantine, todayISO: string): QuarantineDoneCode {
  if (q.clearedAt) return 'cleared'
  return quarantineDaysRemaining(q, todayISO) <= 0 ? 'readyToClear' : 'active'
}
