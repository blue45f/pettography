import { toUtcDate } from '@utils/date'

import {
  NITRATE_DANGER_PPM,
  NITRATE_WARN_PPM,
  PH_MAX,
  PH_MIN,
  TEMP_MAX_C,
  TEMP_MIN_C,
  TOXIN_DANGER_PPM,
  TRACE_PPM,
} from './data'

import type { CycleStatus, ParamFlag, WaterParam, WaterReading } from './schema'

/** A kit reading at/below the trace floor counts as "zero" in cycle logic. */
function isTrace(value: number): boolean {
  return value <= TRACE_PPM
}

/**
 * Classify where a tank sits in the freshwater nitrogen cycle.
 * - toxic: ammonia or nitrite is at a dangerous level (needs a water change now)
 * - cycled: ammonia and nitrite read ~0 while nitrate is present (bacteria established)
 * - cycling: still processing — nitrate ~0 but ammonia or nitrite detectable
 * - unknown: not enough data to decide
 */
export function cycleStatus(reading: WaterReading): CycleStatus {
  const { ammoniaPpm, nitritePpm, nitratePpm } = reading

  if (
    (ammoniaPpm !== null && ammoniaPpm > TOXIN_DANGER_PPM) ||
    (nitritePpm !== null && nitritePpm > TOXIN_DANGER_PPM)
  ) {
    return 'toxic'
  }

  // Deciding cycled vs cycling needs both toxins plus a nitrate reading.
  if (ammoniaPpm === null || nitritePpm === null) return 'unknown'

  const ammoniaClear = isTrace(ammoniaPpm)
  const nitriteClear = isTrace(nitritePpm)

  if (ammoniaClear && nitriteClear) {
    if (nitratePpm !== null && nitratePpm > TRACE_PPM) return 'cycled'
    return 'unknown'
  }

  // Some ammonia or nitrite remains but stays below the toxic line — whether or
  // not nitrate has appeared, the colony is still building (mid-cycle).
  return 'cycling'
}

/** Severity for a single ammonia/nitrite reading: any detectable amount is a concern. */
function toxinFlag(value: number | null): ParamFlag {
  if (value === null) return 'ok'
  if (value > TOXIN_DANGER_PPM) return 'danger'
  if (value > TRACE_PPM) return 'warn'
  return 'ok'
}

function nitrateFlag(value: number | null): ParamFlag {
  if (value === null) return 'ok'
  if (value > NITRATE_DANGER_PPM) return 'danger'
  if (value > NITRATE_WARN_PPM) return 'warn'
  return 'ok'
}

function phFlag(value: number | null): ParamFlag {
  if (value === null) return 'ok'
  if (value < PH_MIN || value > PH_MAX) return 'warn'
  return 'ok'
}

function tempFlag(value: number | null): ParamFlag {
  if (value === null) return 'ok'
  if (value < TEMP_MIN_C || value > TEMP_MAX_C) return 'warn'
  return 'ok'
}

/** Per-parameter severity flags for the latest reading's chips. */
export function paramFlags(reading: WaterReading): Record<WaterParam, ParamFlag> {
  return {
    tempC: tempFlag(reading.tempC),
    ph: phFlag(reading.ph),
    ammoniaPpm: toxinFlag(reading.ammoniaPpm),
    nitritePpm: toxinFlag(reading.nitritePpm),
    nitratePpm: nitrateFlag(reading.nitratePpm),
  }
}

/** Newest reading by measured day (then by createdAt to break same-day ties). */
export function latestReading(readings: readonly WaterReading[]): WaterReading | null {
  if (readings.length === 0) return null
  return sortByDate(readings)[0]
}

/** Descending by measuredAt, falling back to createdAt for stable same-day order. */
export function sortByDate(readings: readonly WaterReading[]): WaterReading[] {
  return [...readings].sort((a, b) => {
    const byDay = b.measuredAt.localeCompare(a.measuredAt)
    if (byDay !== 0) return byDay
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export interface TrendPoint {
  x: number
  y: number
  measuredAt: string
}

/**
 * Chronological (oldest → newest) values for one numeric parameter, skipping
 * readings where it was not measured. `x` is the UTC day timestamp for spacing.
 */
export function trend(readings: readonly WaterReading[], key: WaterParam): TrendPoint[] {
  return sortByDate(readings)
    .slice()
    .reverse()
    .flatMap((r) => {
      const value = r[key]
      if (value === null) return []
      return [{ x: toUtcDate(r.measuredAt).getTime(), y: value, measuredAt: r.measuredAt }]
    })
}
