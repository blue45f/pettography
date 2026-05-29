import { READINESS_ITEMS } from './data'

import type { Priority, WishlistItem } from './schema'
import type { Difficulty } from '@features/species'

/**
 * Pure, side-effect-free wishlist math.
 *
 * Date arithmetic is done in UTC from a `YYYY-MM-DD` string so a "day" is
 * exactly 86_400_000 ms and the D-day countdown never drifts across the user's
 * local timezone / DST.
 */

const MS_PER_DAY = 86_400_000

/** Parse a `YYYY-MM-DD` day-date into a UTC Date at midnight. */
function toUtcDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`)
}

/**
 * Percentage (0..100, rounded) of readiness items checked `true`, out of
 * `totalItems`. Unknown keys and falsy values are ignored. Returns `0` when
 * there are no items so we never divide by zero.
 */
export function readinessPct(item: Pick<WishlistItem, 'readiness'>, totalItems: number): number {
  if (totalItems <= 0) return 0
  const done = READINESS_ITEMS.reduce((acc, id) => acc + (item.readiness[id] ? 1 : 0), 0)
  // Only count up to the declared total in case more keys exist than expected.
  const capped = Math.min(done, totalItems)
  return Math.round((capped / totalItems) * 100)
}

/** Readiness flag codes — the page maps each to a translated label. */
export type ExperienceFlag = 'caution' | 'ok'

/**
 * Honest, intentionally simple experience check: only `advanced` species are
 * flagged as needing extra caution before acquiring. Everything else is `ok`.
 * The engine returns a code; copy lives in i18n.
 */
export function experienceMatch(difficulty: Difficulty): ExperienceFlag {
  return difficulty === 'advanced' ? 'caution' : 'ok'
}

/** Highest-keenness-first ordering for the priority badge / sort. */
const PRIORITY_RANK: Record<Priority, number> = {
  next: 0,
  soon: 1,
  someday: 2,
}

/**
 * Sort by priority (next → soon → someday), then by `createdAt` ascending so
 * older wishes lead within the same priority. Pure: returns a new array and
 * leaves the input untouched.
 */
export function sortWishlist(items: readonly WishlistItem[]): WishlistItem[] {
  return [...items].sort((a, b) => {
    const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    if (byPriority !== 0) return byPriority
    return a.createdAt.localeCompare(b.createdAt)
  })
}

/**
 * Signed whole-day count from `todayISO` to `targetISO` (positive = future,
 * `0` = today, negative = past). Both arguments are `YYYY-MM-DD` day-dates.
 */
export function daysUntil(targetISO: string, todayISO: string): number {
  return Math.round((toUtcDate(targetISO).getTime() - toUtcDate(todayISO).getTime()) / MS_PER_DAY)
}
