import { addDays, daysBetween } from '@utils/date'

import { BRUMATION_PHASES, defaultDaysFor, type BrumationPhaseId } from './data'

import type { BrumationPlan } from './schema'

/**
 * Pure, side-effect-free brumation schedule math.
 *
 * Date arithmetic is always done in UTC from a `YYYY-MM-DD` string so a "day"
 * is exactly 86_400_000 ms apart and the schedule never drifts across the
 * user's local timezone / DST (UTC day primitives live in `@utils/date`).
 * Phase durations come from the plan's `phaseDays` overrides, falling back to
 * the template default per phase, so the engine tolerates a partial or empty
 * override map.
 */

/** Resolved duration for a phase: the plan override, else the template default. */
export function phaseDuration(plan: BrumationPlan, id: BrumationPhaseId): number {
  const override = plan.phaseDays[id]
  if (typeof override === 'number' && Number.isFinite(override) && override > 0) {
    return Math.floor(override)
  }
  return defaultDaysFor(id)
}

export interface PhaseSegment {
  id: BrumationPhaseId
  /** Days from the plan start to the first day of this phase (0-based). */
  startOffsetDay: number
  /** Days from the plan start to the last day of this phase (inclusive). */
  endOffsetDay: number
  /** First calendar day of this phase, `YYYY-MM-DD`. */
  startDate: string
  /** Last calendar day of this phase, `YYYY-MM-DD`. */
  endDate: string
}

/**
 * Lay the ordered phases out cumulatively from `plan.startDate`.
 *
 * Each phase occupies `duration` calendar days; the next phase starts the day
 * after the previous one ends. `endOffsetDay` is inclusive (a 7-day phase
 * starting at offset 0 ends at offset 6), so the total plan length is the last
 * phase's `endOffsetDay + 1`.
 */
export function phaseSchedule(plan: BrumationPlan): PhaseSegment[] {
  const segments: PhaseSegment[] = []
  let cursor = 0
  for (const phase of BRUMATION_PHASES) {
    const duration = phaseDuration(plan, phase.id)
    const startOffsetDay = cursor
    const endOffsetDay = cursor + duration - 1
    segments.push({
      id: phase.id,
      startOffsetDay,
      endOffsetDay,
      startDate: addDays(plan.startDate, startOffsetDay),
      endDate: addDays(plan.startDate, endOffsetDay),
    })
    cursor += duration
  }
  return segments
}

/** Total brumation length in days (sum of every phase's resolved duration). */
export function totalDays(plan: BrumationPlan): number {
  return BRUMATION_PHASES.reduce((sum, phase) => sum + phaseDuration(plan, phase.id), 0)
}

/** The final calendar day of the plan, `YYYY-MM-DD`. */
export function endDate(plan: BrumationPlan): string {
  const total = totalDays(plan)
  // The plan runs `total` days; the last *day* is start + (total - 1).
  return addDays(plan.startDate, Math.max(total - 1, 0))
}

/** Whole days elapsed since the plan started (0 on the start day, negative before). */
export function dayInPlan(plan: BrumationPlan, todayISO: string): number {
  return daysBetween(plan.startDate, todayISO)
}

/**
 * The phase active on `todayISO`, or `null` when today falls outside the plan
 * (before the start date, or on/after the day the plan ends).
 */
export function currentPhase(plan: BrumationPlan, todayISO: string): BrumationPhaseId | null {
  const day = dayInPlan(plan, todayISO)
  if (day < 0) return null
  const segment = phaseSchedule(plan).find((s) => day >= s.startOffsetDay && day <= s.endOffsetDay)
  return segment ? segment.id : null
}

/**
 * Plan progress as a 0..100 percentage, clamped. Measured against the full
 * length so 0% is the start day and 100% is the final day of recovery.
 */
export function progressPct(plan: BrumationPlan, todayISO: string): number {
  const total = totalDays(plan)
  if (total <= 0) return 0
  const day = dayInPlan(plan, todayISO)
  const pct = (day / total) * 100
  return Math.min(Math.max(pct, 0), 100)
}
