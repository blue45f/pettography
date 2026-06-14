import { recommendedDayLength, type DayLengthRange, type SeasonId } from './data'

import type { SpeciesCategory } from '@domains/species'

/**
 * Pure, side-effect-free photoperiod math. Nothing here reads the clock or any
 * store, so it can be unit-tested without mocking; the caller passes the month
 * index / hours in.
 */

/**
 * The resulting day length (lit hours) for a lights-on / lights-off pair, in
 * whole hours.
 *
 * Hours are whole-hour positions on a 24-hour clock (0..23). When the lights go
 * off *after* they come on (e.g. on 7 → off 19) the day length is the simple
 * difference (12h). When the schedule wraps past midnight (on 20 → off 6) we
 * add a full day to the off hour so the result stays positive (10h). Equal
 * on/off hours mean the lights never cycle within the period: we treat that as
 * a 24-hour day (always-on) rather than 0, which matches keeper intuition for a
 * light left on.
 */
export function dayLengthHours(onHour: number, offHour: number): number {
  const on = ((Math.trunc(onHour) % 24) + 24) % 24
  const off = ((Math.trunc(offHour) % 24) + 24) % 24
  if (on === off) return 24
  const span = off - on
  return span > 0 ? span : span + 24
}

/**
 * The meteorological season for a 0-based month index (`Date#getMonth()`):
 * spring Mar–May, summer Jun–Aug, autumn Sep–Nov, winter Dec–Feb. Out-of-range
 * / negative input is wrapped into 0..11 defensively so it never throws.
 */
export function seasonForMonth(monthIndex: number): SeasonId {
  const m = (((Math.trunc(monthIndex) % 12) + 12) % 12) as number
  if (m >= 2 && m <= 4) return 'spring'
  if (m >= 5 && m <= 7) return 'summer'
  if (m >= 8 && m <= 10) return 'autumn'
  return 'winter'
}

/** The recommended day-length window for a category in a season (table lookup). */
export function recommendedRange(
  category: SpeciesCategory | null | undefined,
  season: SeasonId
): DayLengthRange {
  return recommendedDayLength(category, season)
}

/** How a measured day length compares to the recommended window. */
export type DayLengthVerdict = 'low' | 'ok' | 'high'

/**
 * Compare a day length to a recommended range. Below `min` → `'low'` (extend
 * the photoperiod), above `max` → `'high'` (shorten it), otherwise `'ok'`. The
 * bounds are inclusive.
 */
export function compareToRecommended(dayLength: number, range: DayLengthRange): DayLengthVerdict {
  if (dayLength < range.min) return 'low'
  if (dayLength > range.max) return 'high'
  return 'ok'
}
