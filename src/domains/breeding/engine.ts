import { MS_PER_DAY, addDays, toUtcDate } from '@utils/date'

import { incubationRef } from './data'

import type { Clutch } from './schema'

/**
 * Pure, side-effect-free incubation math. Date arithmetic is always done in
 * UTC from a `YYYY-MM-DD` string so a "day" is exactly 86_400_000 ms apart and
 * we never drift across the user's local timezone / DST (UTC day primitives
 * live in `@utils/date`).
 *
 * Note: the incubation reference table is keyed by species *slug*
 * (e.g. `ball-python`), so engine functions take the slug — the page resolves
 * a clutch's internal `speciesId` to its slug before calling in.
 */

export interface HatchWindow {
  /** Earliest plausible hatch date, `YYYY-MM-DD` (laidAt + minDays). */
  earliest: string
  /** Latest plausible hatch date, `YYYY-MM-DD` (laidAt + maxDays). */
  latest: string
  /** Midpoint of the window, `YYYY-MM-DD` — used for the headline D-day. */
  midpoint: string
}

/** Estimate the hatch window from a laid date and the species' reference table. */
export function estimateHatchWindow(
  laidAtISO: string,
  slug: string | null | undefined
): HatchWindow {
  const ref = incubationRef(slug)
  const earliest = addDays(laidAtISO, ref.minDays)
  const latest = addDays(laidAtISO, ref.maxDays)
  const midpoint = addDays(laidAtISO, Math.round((ref.minDays + ref.maxDays) / 2))
  return { earliest, latest, midpoint }
}

/** Signed whole-day count from `todayISO` to `dateISO` (negative once past). */
export function daysUntil(dateISO: string, todayISO: string): number {
  const diff = toUtcDate(dateISO).getTime() - toUtcDate(todayISO).getTime()
  return Math.round(diff / MS_PER_DAY)
}

/**
 * Incubation progress as a 0..100 percentage, clamped. Progress is measured
 * against the full window length (laidAt → latest), so 100% lines up with the
 * end of the plausible window rather than the midpoint.
 */
export function incubationProgress(
  laidAtISO: string,
  slug: string | null | undefined,
  todayISO: string
): number {
  const ref = incubationRef(slug)
  const elapsed = -daysUntil(laidAtISO, todayISO) // days since the eggs were laid
  const total = ref.maxDays
  if (total <= 0) return 0
  const pct = (elapsed / total) * 100
  return Math.min(Math.max(pct, 0), 100)
}

export type ClutchStatusCode = 'incubating' | 'due' | 'overdue' | 'hatched' | 'failed'

/**
 * Resolve the display status code for a clutch as of `todayISO`.
 *
 * User-set `hatched` / `failed` always win. An `incubating` clutch is refined
 * into `due` (today is within the earliest→latest window) or `overdue` (today
 * is past the latest plausible hatch); otherwise it stays `incubating`.
 *
 * `slug` is the species slug used to look up the incubation globalThis.
 */
export function clutchStatusLabelCode(
  clutch: Clutch,
  todayISO: string,
  slug: string | null | undefined
): ClutchStatusCode {
  if (clutch.status === 'hatched') return 'hatched'
  if (clutch.status === 'failed') return 'failed'

  const { earliest, latest } = estimateHatchWindow(clutch.laidAt, slug)
  if (daysUntil(latest, todayISO) < 0) return 'overdue'
  if (daysUntil(earliest, todayISO) <= 0) return 'due'
  return 'incubating'
}

/** Fertility rate as a 0..100 percentage, or null when either count is missing. */
export function fertilityRate(clutch: Clutch): number | null {
  if (clutch.fertileCount === null || clutch.fertileCount === undefined) return null
  if (clutch.eggCount <= 0) return null
  return (clutch.fertileCount / clutch.eggCount) * 100
}
