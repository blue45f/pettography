import type { SafetyLevel } from './schema'

/**
 * Pure, side-effect-free progress + scoring math for the enclosure safety
 * audit.
 *
 * Both progress helpers count how many of a given set of item ids are confirmed
 * in the `checked` map. Unknown keys in `checked` (e.g. items dropped from a
 * later catalog version) are ignored — only the ids passed in are counted.
 */

export interface AuditProgress {
  done: number
  total: number
  /** Completion percentage, integer, clamped to 0..100. */
  pct: number
}

function countDone(checked: Record<string, boolean>, itemIds: readonly string[]): number {
  let done = 0
  for (const id of itemIds) {
    if (checked[id]) done += 1
  }
  return done
}

function toPct(done: number, total: number): number {
  if (total <= 0) return 0
  const raw = Math.round((done / total) * 100)
  return Math.min(100, Math.max(0, raw))
}

/** Overall completion across every audit item. */
export function auditProgress(
  checked: Record<string, boolean>,
  allItemIds: readonly string[]
): AuditProgress {
  const total = allItemIds.length
  const done = countDone(checked, allItemIds)
  return { done, total, pct: toPct(done, total) }
}

/** Completion for a single group's items. */
export function groupProgress(
  checked: Record<string, boolean>,
  groupItemIds: readonly string[]
): AuditProgress {
  const total = groupItemIds.length
  const done = countDone(checked, groupItemIds)
  return { done, total, pct: toPct(done, total) }
}

/**
 * Maps a completion percentage to a safety level.
 * `< 50` → low, `< 85` → medium, otherwise high. Out-of-range input is clamped.
 */
export function safetyLevel(pct: number): SafetyLevel {
  const clamped = Math.min(100, Math.max(0, pct))
  if (clamped < 50) return 'low'
  if (clamped < 85) return 'medium'
  return 'high'
}
