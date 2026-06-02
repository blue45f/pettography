import { addDays, daysBetween } from '@utils/date'

import type { MoltEvent } from './schema'

/**
 * All shed/molt analytics live here as pure, side-effect-free functions so the
 * predictor stays easy to reason about and exhaustively testable.
 *
 * Date math is always done in UTC from a `YYYY-MM-DD` string to avoid local
 * timezone / DST drift: a "day" is exactly 86_400_000 ms apart. The UTC day
 * primitives (`addDays`, `daysBetween`) live in `@utils/date`.
 */

// Re-exported so existing `@features/molt` consumers keep their date helpers.
export { addDays, daysBetween }

/** Events sorted ascending by `occurredAt`. Stable, non-mutating. */
export function sortByDate(events: MoltEvent[]): MoltEvent[] {
  return [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
}

/**
 * A cycle "anchor" is any logged shed/molt event that marks a completed
 * cadence point. `in_progress` events describe an ongoing (not-yet-finished)
 * shed, so they are excluded — every other kind anchors the cycle.
 */
function isAnchor(event: MoltEvent): boolean {
  return event.kind !== 'in_progress'
}

/** Anchor events sorted ascending by date. */
export function anchorEvents(events: MoltEvent[]): MoltEvent[] {
  return sortByDate(events.filter(isAnchor))
}

/**
 * Gaps in days between consecutive anchor events. With N anchors you get
 * N-1 intervals; fewer than 2 anchors yields an empty array.
 */
export function completedIntervalsDays(events: MoltEvent[]): number[] {
  const anchors = anchorEvents(events)
  const intervals: number[] = []
  for (let i = 1; i < anchors.length; i += 1) {
    intervals.push(daysBetween(anchors[i - 1].occurredAt, anchors[i].occurredAt))
  }
  return intervals
}

/** Mean cycle length in days (rounded), or null with <2 anchors. */
export function averageCycleDays(events: MoltEvent[]): number | null {
  const intervals = completedIntervalsDays(events)
  if (intervals.length === 0) return null
  const sum = intervals.reduce((acc, d) => acc + d, 0)
  return Math.round(sum / intervals.length)
}

/** Median cycle length in days (rounded), or null with <2 anchors. */
export function medianCycleDays(events: MoltEvent[]): number | null {
  const intervals = completedIntervalsDays(events)
  if (intervals.length === 0) return null
  const sorted = [...intervals].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  return Math.round(median)
}

export type PredictionConfidence = 'low' | 'medium' | 'high'

export interface MoltPrediction {
  /** Predicted next shed date, `YYYY-MM-DD`. */
  predictedDate: string
  /** The interval (average cycle) used for the projection, in days. */
  intervalDays: number
  /** Signed days from `today` to `predictedDate` (negative once overdue). */
  daysUntil: number
  confidence: PredictionConfidence
  overdue: boolean
}

/** Confidence scales with how many intervals we have to learn from. */
function confidenceFor(intervalCount: number): PredictionConfidence {
  if (intervalCount >= 4) return 'high'
  if (intervalCount >= 2) return 'medium'
  return 'low'
}

/**
 * Project the next shed/molt from the most recent anchor plus the average
 * cycle length. Returns null when there isn't enough history to average.
 */
export function predictNext(events: MoltEvent[], today: string): MoltPrediction | null {
  const average = averageCycleDays(events)
  if (average === null) return null

  const anchors = anchorEvents(events)
  const lastAnchor = anchors[anchors.length - 1]
  const predictedDate = addDays(lastAnchor.occurredAt, average)
  const daysUntil = daysBetween(today, predictedDate)
  const intervalCount = anchors.length - 1

  return {
    predictedDate,
    intervalDays: average,
    daysUntil,
    confidence: confidenceFor(intervalCount),
    overdue: daysUntil < 0,
  }
}

export interface MoltStats {
  total: number
  completeCount: number
  stuckCount: number
  /** Most recent anchor date, `YYYY-MM-DD`, or null when none logged. */
  lastDate: string | null
}

/** Roll-up counts used by the page header / summary. */
export function moltStats(events: MoltEvent[]): MoltStats {
  const anchors = anchorEvents(events)
  const lastDate = anchors.length > 0 ? anchors[anchors.length - 1].occurredAt : null
  return {
    total: events.length,
    completeCount: events.filter((e) => e.kind === 'complete').length,
    stuckCount: events.filter((e) => e.kind === 'stuck').length,
    lastDate,
  }
}
