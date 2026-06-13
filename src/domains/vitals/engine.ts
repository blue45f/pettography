import type { VitalReading, VitalType } from './schema'

/**
 * Breaths/beats per minute from a tap count over a window.
 * round(taps / seconds * 60); seconds <= 0 guards to 0 (no divide-by-zero).
 */
export function bpm(taps: number, seconds: number): number {
  if (seconds <= 0) return 0
  return Math.round((taps / seconds) * 60)
}

/** Readings sorted ascending by measurement date, then creation time. */
export function sortByDate(readings: VitalReading[]): VitalReading[] {
  return [...readings].sort((a, b) => {
    const byDate = a.measuredAt.localeCompare(b.measuredAt)
    if (byDate !== 0) return byDate
    return a.createdAt.localeCompare(b.createdAt)
  })
}

/** Most recent reading of a given type, or null when none exist. */
export function latestByType(readings: VitalReading[], type: VitalType): VitalReading | null {
  const sorted = sortByDate(readings.filter((r) => r.type === type))
  return sorted.length ? sorted[sorted.length - 1] : null
}

/** Chronological bpm values for a type, oldest first — feeds the Sparkline. */
export function trend(readings: VitalReading[], type: VitalType): number[] {
  return sortByDate(readings.filter((r) => r.type === type)).map((r) => r.bpm)
}

export interface VitalsStats {
  total: number
  latestRespiration: number | null
  latestHeartrate: number | null
  respirationCount: number
  heartrateCount: number
}

export function vitalsStats(readings: VitalReading[]): VitalsStats {
  const respiration = readings.filter((r) => r.type === 'respiration')
  const heartrate = readings.filter((r) => r.type === 'heartrate')
  return {
    total: readings.length,
    latestRespiration: latestByType(readings, 'respiration')?.bpm ?? null,
    latestHeartrate: latestByType(readings, 'heartrate')?.bpm ?? null,
    respirationCount: respiration.length,
    heartrateCount: heartrate.length,
  }
}
