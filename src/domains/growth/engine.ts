import type { GrowthEntry, GrowthNorm, WeightStatus } from './schema'

function toUtc(iso: string): number {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).getTime()
}

const DAY = 86_400_000

/** Entries sorted ascending by measurement date. */
export function sortByDate(entries: GrowthEntry[]): GrowthEntry[] {
  return [...entries].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
}

export function latestEntry(entries: GrowthEntry[]): GrowthEntry | null {
  const sorted = sortByDate(entries)
  return sorted.length ? sorted[sorted.length - 1] : null
}

/** Days between the first and last measurement. */
export function daysSpan(entries: GrowthEntry[]): number {
  if (entries.length < 2) return 0
  const sorted = sortByDate(entries)
  return Math.round(
    (toUtc(sorted[sorted.length - 1].measuredAt) - toUtc(sorted[0].measuredAt)) / DAY
  )
}

/** Net weight change from first to last measurement. */
export function weightChange(entries: GrowthEntry[]): { deltaG: number; pct: number } | null {
  if (entries.length < 2) return null
  const sorted = sortByDate(entries)
  const first = sorted[0].weightGram
  const last = sorted[sorted.length - 1].weightGram
  const deltaG = Math.round((last - first) * 10) / 10
  const pct = first > 0 ? Math.round(((last - first) / first) * 100) : 0
  return { deltaG, pct }
}

/** Average growth in grams per week across the logged span. */
export function growthRatePerWeek(entries: GrowthEntry[]): number | null {
  const span = daysSpan(entries)
  if (span <= 0) return null
  const change = weightChange(entries)
  if (!change) return null
  return Math.round((change.deltaG / span) * 7 * 10) / 10
}

/** Where a weight sits relative to the species' typical adult band. */
export function statusVsNorm(weightG: number, norm: GrowthNorm | null): WeightStatus | null {
  if (!norm) return null
  if (weightG < norm.adultWeightMinG) return 'below'
  if (weightG > norm.adultWeightMaxG) return 'above'
  return 'normal'
}

export interface GrowthStats {
  count: number
  latestWeight: number | null
  latestLength: number | null
  change: { deltaG: number; pct: number } | null
  ratePerWeek: number | null
  status: WeightStatus | null
}

export function growthStats(entries: GrowthEntry[], norm: GrowthNorm | null): GrowthStats {
  const latest = latestEntry(entries)
  return {
    count: entries.length,
    latestWeight: latest?.weightGram ?? null,
    latestLength: latest?.lengthCm ?? null,
    change: weightChange(entries),
    ratePerWeek: growthRatePerWeek(entries),
    status: latest ? statusVsNorm(latest.weightGram, norm) : null,
  }
}

/**
 * Build normalized [0,1] chart points (x = time across span, y = weight across
 * the value range) for a simple SVG plot. Returns null when there's nothing to draw.
 */
export function chartPoints(
  entries: GrowthEntry[],
  norm: GrowthNorm | null
): {
  points: { x: number; y: number; weightGram: number; measuredAt: string }[]
  minW: number
  maxW: number
} | null {
  if (!entries.length) return null
  const sorted = sortByDate(entries)
  const weights = sorted.map((e) => e.weightGram)
  const lo = Math.min(...weights, norm ? norm.adultWeightMinG : Infinity)
  const hi = Math.max(...weights, norm ? norm.adultWeightMaxG : -Infinity)
  const minW = Number.isFinite(lo) ? lo : Math.min(...weights)
  const maxW = Number.isFinite(hi) ? hi : Math.max(...weights)
  const range = maxW - minW || 1
  const t0 = toUtc(sorted[0].measuredAt)
  const tSpan = toUtc(sorted[sorted.length - 1].measuredAt) - t0 || 1
  const points = sorted.map((e) => ({
    x: (toUtc(e.measuredAt) - t0) / tSpan,
    y: (e.weightGram - minW) / range,
    weightGram: e.weightGram,
    measuredAt: e.measuredAt,
  }))
  return { points, minW, maxW }
}
