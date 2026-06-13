import type { HandlingSession } from './schema'
import type { HandlingTolerance } from '@domains/species'

/**
 * Pure, side-effect-free analytics for the handling tracker. Everything here is
 * deterministic so the guidance can be exhaustively tested.
 *
 * Date math, when needed, is done in UTC from a `YYYY-MM-DD` string via
 * `new Date(`${iso}T00:00:00Z`)` to avoid local timezone / DST drift.
 */

/** Sessions sorted descending by `sessionAt` (newest first). Non-mutating. */
export function sortByDate(sessions: HandlingSession[]): HandlingSession[] {
  return [...sessions].sort((a, b) => b.sessionAt.localeCompare(a.sessionAt))
}

/** The most recent session (by date), or null when there are none. */
export function latestSession(sessions: HandlingSession[]): HandlingSession | null {
  return sortByDate(sessions)[0] ?? null
}

/** Mean calmness across all sessions (rounded to 1 decimal), or null when empty. */
export function avgCalmness(sessions: HandlingSession[]): number | null {
  if (sessions.length === 0) return null
  const sum = sessions.reduce((acc, s) => acc + s.calmness, 0)
  return Math.round((sum / sessions.length) * 10) / 10
}

/**
 * Calmness values ordered oldest -> newest, suitable for a Sparkline.
 * Reads naturally left (past) to right (present).
 */
export function calmnessTrend(sessions: HandlingSession[]): number[] {
  return sortByDate(sessions)
    .slice()
    .reverse()
    .map((s) => s.calmness)
}

/**
 * Improvement signal: average calmness of the recent half minus the average of
 * the earlier half. Positive = improving, negative = declining, ~0 = stable.
 * Returns null with fewer than two sessions (no two halves to compare).
 *
 * Rounded to 1 decimal. The split puts the larger half into the "earlier"
 * bucket on an odd count so the most recent sessions dominate "recent".
 */
export function progressDelta(sessions: HandlingSession[]): number | null {
  if (sessions.length < 2) return null
  const chronological = sortByDate(sessions).slice().reverse()
  const splitAt = Math.floor(chronological.length / 2)
  const earlier = chronological.slice(0, splitAt)
  const recent = chronological.slice(splitAt)
  const earlierAvg = avgCalmness(earlier)
  const recentAvg = avgCalmness(recent)
  if (earlierAvg === null || recentAvg === null) return null
  return Math.round((recentAvg - earlierAvg) * 10) / 10
}

export type GuidanceCode =
  | 'noData'
  | 'lowTolerance'
  | 'highStress'
  | 'goodProgress'
  | 'declining'
  | 'steady'

/** How many of the most recent sessions feed the stress / trend check. */
const RECENT_WINDOW = 3
/** Calmness at or below this is treated as a stressed session. */
const LOW_CALMNESS = 2
/** Total stress signs across the recent window that trips the high-stress flag. */
const HIGH_STRESS_SIGN_COUNT = 3

/**
 * Map handling tolerance + recent history to a guidance code the page turns
 * into copy via `t('taming.guidance.<code>')`.
 *
 * Priority order (welfare first):
 *  1. noData        — nothing logged yet.
 *  2. highStress    — recent sessions show many stress signs or low calmness;
 *                     advise backing off regardless of tolerance.
 *  3. lowTolerance  — species barely tolerates handling; always warn.
 *  4. goodProgress  — calmness is clearly improving.
 *  5. declining     — calmness is clearly dropping.
 *  6. steady        — handling is going fine; carry on gently.
 */
export function handlingGuidanceCode(
  tolerance: HandlingTolerance | null | undefined,
  sessions: HandlingSession[],
): GuidanceCode {
  if (sessions.length === 0) return 'noData'

  const recent = sortByDate(sessions).slice(0, RECENT_WINDOW)
  const recentSignCount = recent.reduce((acc, s) => acc + s.stressSigns.length, 0)
  const lowCalmCount = recent.filter((s) => s.calmness <= LOW_CALMNESS).length

  const highStress =
    recentSignCount >= HIGH_STRESS_SIGN_COUNT || lowCalmCount >= Math.ceil(recent.length / 2)
  if (highStress) return 'highStress'

  if (tolerance === 'low') return 'lowTolerance'

  const delta = progressDelta(sessions)
  if (delta !== null && delta >= 0.5) return 'goodProgress'
  if (delta !== null && delta <= -0.5) return 'declining'
  return 'steady'
}
