import type { LifeStage } from './schema'

const MONTHS_PER_YEAR = 12

/** Fraction of the *minimum* lifespan at which an animal is no longer juvenile. */
export const JUVENILE_THRESHOLD = 0.25
/** Fraction of the *minimum* lifespan at which an animal is considered senior. */
export const SENIOR_THRESHOLD = 0.75

export function monthsToYears(ageMonths: number): number {
  return ageMonths / MONTHS_PER_YEAR
}

export function yearsToMonths(ageYears: number): number {
  return Math.round(ageYears * MONTHS_PER_YEAR)
}

/** A lifespan range we can actually reason about. */
function hasLifespan(min: number | null | undefined, max: number | null | undefined): boolean {
  return typeof min === 'number' && typeof max === 'number' && min > 0 && max >= min
}

/**
 * Map an age onto a coarse life stage using the species' lifespan range.
 *
 * - `juvenile`  — below ~25% of the *minimum* lifespan
 * - `adult`     — the broad middle
 * - `senior`    — at/above ~75% of the *minimum* lifespan
 * - `geriatric` — at/above the *maximum* lifespan (living long)
 *
 * Returns `null` when there is no usable lifespan data so callers can fall back
 * to a friendly "no data" state rather than guessing.
 */
export function lifeStage(
  ageYears: number,
  lifespanMinYears: number | null | undefined,
  lifespanMaxYears: number | null | undefined,
): LifeStage | null {
  if (ageYears < 0) return null
  if (!hasLifespan(lifespanMinYears, lifespanMaxYears)) return null
  const min = lifespanMinYears as number
  const max = lifespanMaxYears as number

  if (ageYears >= max) return 'geriatric'
  if (ageYears >= min * SENIOR_THRESHOLD) return 'senior'
  if (ageYears < min * JUVENILE_THRESHOLD) return 'juvenile'
  return 'adult'
}

/** Whether a stage warrants senior-care adjustments. */
export function isSeniorStage(stage: LifeStage | null): boolean {
  return stage === 'senior' || stage === 'geriatric'
}

/**
 * Age as a percentage of maximum lifespan, clamped to 0..100. Used for the
 * lifespan progress bar. Returns `null` without usable lifespan data.
 */
export function lifeProgressPct(
  ageYears: number,
  lifespanMaxYears: number | null | undefined,
): number | null {
  if (typeof lifespanMaxYears !== 'number' || lifespanMaxYears <= 0) return null
  const pct = (Math.max(ageYears, 0) / lifespanMaxYears) * 100
  return Math.min(Math.max(pct, 0), 100)
}

/**
 * Rough expected remaining years, measured against the *midpoint* of the
 * lifespan range and clamped at 0. Deliberately approximate — surfaced to the
 * keeper with an explicit "estimate" caveat. Returns `null` without data.
 */
export function expectedRemainingYears(
  ageYears: number,
  lifespanMinYears: number | null | undefined,
  lifespanMaxYears: number | null | undefined,
): number | null {
  if (!hasLifespan(lifespanMinYears, lifespanMaxYears)) return null
  const min = lifespanMinYears as number
  const max = lifespanMaxYears as number
  const midpoint = (min + max) / 2
  const remaining = midpoint - Math.max(ageYears, 0)
  return Math.max(Math.round(remaining * 10) / 10, 0)
}

/** Count of completed checklist items given a (possibly sparse) completion map. */
export function checklistProgress(
  itemIds: readonly string[],
  checklist: Record<string, boolean>,
): { done: number; total: number; pct: number } {
  const total = itemIds.length
  const done = itemIds.reduce((acc, id) => acc + (checklist[id] ? 1 : 0), 0)
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return { done, total, pct }
}
