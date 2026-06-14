import { SEASONS, type Season } from './schema'

import type { SpeciesCategory } from '@domains/species'

/**
 * Season-by-season husbandry priorities, organised so the UI is a pure
 * lookup. Every entry here is an i18n *key suffix*, not user-facing copy:
 *
 *   - per-category tip → `seasonal.tips.<season>.<category>`
 *   - season-wide tip  → `seasonal.tips.<season>.general`
 *   - season name      → `seasonal.seasons.<season>.name`
 *   - season blurb     → `seasonal.seasons.<season>.blurb`
 *   - month range      → `seasonal.seasons.<season>.months`
 *
 * Timing assumes the northern hemisphere (Korea / Japan): winter heating and
 * dry indoor air, summer overheating risk, spring breeding cues and rising
 * appetite, autumn shortening photoperiod and cool-down. The actual guidance
 * copy lives in the locale files so it stays translatable and reviewable.
 */

export interface SeasonGuide {
  /** Stable season id, also the i18n sub-key. */
  id: Season
  /** A representative emoji for the season (decorative only). */
  emoji: string
  /**
   * Whether this season is when brumation (controlled cool dormancy) is
   * typically relevant for the species that undergo it. True for winter;
   * autumn is the prep window but the planner lives under `/brumation`.
   */
  brumationSeason: boolean
}

/**
 * The four seasons with their static metadata, in calendar order. The engine
 * reorders them to put the current season first; the raw catalog stays in a
 * stable order so tests and lookups are predictable.
 */
export const SEASONAL_GUIDE: readonly SeasonGuide[] = [
  { id: 'spring', emoji: '🌱', brumationSeason: false },
  { id: 'summer', emoji: '☀️', brumationSeason: false },
  { id: 'autumn', emoji: '🍂', brumationSeason: false },
  { id: 'winter', emoji: '❄️', brumationSeason: true },
] as const

/** All five keeper categories, mirroring `SPECIES_CATEGORIES`. */
const GUIDE_CATEGORIES: readonly SpeciesCategory[] = [
  'reptile',
  'arthropod',
  'bird',
  'amphibian',
  'mammal',
] as const

/** Look up a season's metadata, falling back to winter for unknown ids. */
export function guideForSeason(season: Season): SeasonGuide {
  return SEASONAL_GUIDE.find((g) => g.id === season) ?? SEASONAL_GUIDE[3]
}

/**
 * The i18n key for a category's tip in a given season. When `category` is
 * null/undefined (no active pet) the caller should fall back to a default
 * category; this helper only builds the path.
 */
export function categoryTipKey(season: Season, category: SpeciesCategory): string {
  return `seasonal.tips.${season}.${category}`
}

/** The i18n key for a season's general (category-agnostic) tip. */
export function generalTipKey(season: Season): string {
  return `seasonal.tips.${season}.general`
}

/**
 * Whether winter brumation guidance is worth surfacing for a category.
 * Reptiles are the canonical brumators in this app (see `/brumation`); other
 * categories don't get the cross-link.
 */
export function brumationRelevant(category: SpeciesCategory | null | undefined): boolean {
  return category === 'reptile'
}

/** Re-exported so the page can iterate without re-importing from species. */
export { GUIDE_CATEGORIES, SEASONS }
