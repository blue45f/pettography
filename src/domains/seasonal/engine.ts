import { SEASONS, type Season } from './schema'

/**
 * Pure, side-effect-free season math for the northern hemisphere (Korea / Japan).
 *
 * Meteorological seasons grouped by month:
 *   - spring : Mar, Apr, May
 *   - summer : Jun, Jul, Aug
 *   - autumn : Sep, Oct, Nov
 *   - winter : Dec, Jan, Feb
 *
 * `monthIndex` is the 0-based month from `Date#getMonth()` (0 = January, 11 =
 * December). The caller is responsible for reading the clock; everything here
 * is deterministic so it can be unit-tested without mocking `Date`.
 */

/**
 * The season a 0-based month falls in. Out-of-range input is wrapped into
 * 0..11 (defensive) so an unexpected value never throws.
 */
export function currentSeason(monthIndex: number): Season {
  // Normalise into 0..11; ((n % 12) + 12) % 12 handles negatives too.
  const m = (((Math.trunc(monthIndex) % 12) + 12) % 12) as number
  if (m >= 2 && m <= 4) return 'spring' // Mar–May
  if (m >= 5 && m <= 7) return 'summer' // Jun–Aug
  if (m >= 8 && m <= 10) return 'autumn' // Sep–Nov
  return 'winter' // Dec, Jan, Feb
}

/**
 * The four seasons starting from `current`, then continuing in calendar order
 * and wrapping around. Used to render the current season first while keeping
 * the others in their natural sequence.
 *
 * e.g. `orderedSeasonsFrom('autumn')` → `['autumn', 'winter', 'spring', 'summer']`.
 */
export function orderedSeasonsFrom(current: Season): Season[] {
  const start = SEASONS.indexOf(current)
  if (start < 0) return [...SEASONS]
  return SEASONS.map((_, i) => SEASONS[(start + i) % SEASONS.length])
}
