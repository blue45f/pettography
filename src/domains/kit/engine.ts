/**
 * Pure, side-effect-free progress math for the emergency-preparedness kit.
 *
 * Both helpers count how many of a given set of item ids are marked ready in
 * the `checked` map. Unknown keys in `checked` (e.g. items removed from a
 * later catalog version) are ignored — only the ids passed in are counted.
 */

export interface KitProgress {
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

/** Overall readiness across every checklist item. */
export function kitProgress(
  checked: Record<string, boolean>,
  allItemIds: readonly string[]
): KitProgress {
  const total = allItemIds.length
  const done = countDone(checked, allItemIds)
  return { done, total, pct: toPct(done, total) }
}

/** Readiness for a single group's items. */
export function groupProgress(
  checked: Record<string, boolean>,
  groupItemIds: readonly string[]
): KitProgress {
  const total = groupItemIds.length
  const done = countDone(checked, groupItemIds)
  return { done, total, pct: toPct(done, total) }
}
