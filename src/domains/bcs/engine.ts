import type { BcsEntry } from './schema'

export type BcsStatus = 'under' | 'ideal' | 'over'

/** Entries sorted ascending by assessment date, then creation time. */
export function sortByDate(entries: BcsEntry[]): BcsEntry[] {
  return [...entries].sort((a, b) => {
    const byDate = a.assessedAt.localeCompare(b.assessedAt)
    if (byDate !== 0) return byDate
    return a.createdAt.localeCompare(b.createdAt)
  })
}

/** Most recent assessment, or null when there are none. */
export function latestBcs(entries: BcsEntry[]): BcsEntry | null {
  const sorted = sortByDate(entries)
  return sorted.length ? sorted[sorted.length - 1] : null
}

/** Chronological score values, oldest first — feeds the Sparkline. */
export function bcsTrend(entries: BcsEntry[]): number[] {
  return sortByDate(entries).map((e) => e.score)
}

/**
 * Welfare bucket for a score: 1–2 under (저체중), 3 ideal (이상),
 * 4–5 over (과체중). Out-of-range scores clamp to the nearest bucket.
 */
export function statusForScore(score: number): BcsStatus {
  if (score <= 2) return 'under'
  if (score >= 4) return 'over'
  return 'ideal'
}

export interface BcsStats {
  total: number
  latestScore: number | null
  latestStatus: BcsStatus | null
  averageScore: number | null
}

export function bcsStats(entries: BcsEntry[]): BcsStats {
  const latest = latestBcs(entries)
  const total = entries.length
  const average = total
    ? Math.round((entries.reduce((sum, e) => sum + e.score, 0) / total) * 10) / 10
    : null
  return {
    total,
    latestScore: latest?.score ?? null,
    latestStatus: latest ? statusForScore(latest.score) : null,
    averageScore: average,
  }
}
