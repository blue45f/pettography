import type { SpeciesCategory } from '@features/species'

/**
 * Per-category photoperiod (day-length) reference targets by season, plus UVB
 * guidance keys. Everything here is an i18n *key suffix* or a numeric range —
 * never user-facing copy — so the page is a pure lookup and all wording stays
 * translatable.
 *
 * Timing assumes the northern hemisphere (Korea / Japan): summer is the long
 * photoperiod, winter the short one. Ranges are sensible keeper-consensus
 * starting points, NOT precise prescriptions; actual targets depend on the
 * species, its origin latitude, and breeding goals. The page surfaces that
 * caveat.
 *
 *   - reptile  : strong seasonal swing (≈10–11h winter, ≈13–14h summer) — the
 *                photoperiod itself is a husbandry lever for appetite/breeding.
 *   - bird     : fairly stable ≈12h with a slight seasonal shift; long days can
 *                push hens into chronic laying, so don't over-extend.
 *   - amphibian: ≈12h, light-sensitive; many are crepuscular/nocturnal and want
 *                gentle, low-intensity lighting with a modest seasonal nudge.
 *   - arthropod: most need no "lighting" beyond an ambient day/night cue; ≈12h
 *                ambient, never harsh direct light (many are nocturnal).
 *   - mammal   : many small exotic mammals are nocturnal/crepuscular; a stable
 *                ≈12h ambient day/night rhythm matters more than bright light.
 */

/** The four meteorological seasons (spring first), used as lookup keys. */
export const SEASON_IDS = ['spring', 'summer', 'autumn', 'winter'] as const
export type SeasonId = (typeof SEASON_IDS)[number]

/** A min/max recommended day length in whole-ish hours. */
export interface DayLengthRange {
  min: number
  max: number
}

/**
 * Recommended day-length window per category per season. Spring and autumn are
 * intentionally intermediate (the transition seasons) between the summer peak
 * and the winter trough.
 */
const DAY_LENGTH_TABLE: Record<SpeciesCategory, Record<SeasonId, DayLengthRange>> = {
  reptile: {
    spring: { min: 12, max: 13 },
    summer: { min: 13, max: 14 },
    autumn: { min: 11, max: 12 },
    winter: { min: 10, max: 11 },
  },
  bird: {
    spring: { min: 12, max: 13 },
    summer: { min: 12, max: 14 },
    autumn: { min: 11, max: 12 },
    winter: { min: 10, max: 12 },
  },
  amphibian: {
    spring: { min: 12, max: 13 },
    summer: { min: 12, max: 13 },
    autumn: { min: 11, max: 12 },
    winter: { min: 10, max: 12 },
  },
  arthropod: {
    spring: { min: 12, max: 12 },
    summer: { min: 12, max: 13 },
    autumn: { min: 11, max: 12 },
    winter: { min: 10, max: 12 },
  },
  mammal: {
    spring: { min: 11, max: 13 },
    summer: { min: 12, max: 14 },
    autumn: { min: 10, max: 12 },
    winter: { min: 10, max: 12 },
  },
}

/** Fallback used when no active-pet category is known. */
const FALLBACK_CATEGORY: SpeciesCategory = 'reptile'

/**
 * The recommended day-length window for a category in a season. Falls back to a
 * sensible default category when `category` is null/undefined (no active pet),
 * so callers never have to special-case it.
 */
export function recommendedDayLength(
  category: SpeciesCategory | null | undefined,
  season: SeasonId
): DayLengthRange {
  const table = DAY_LENGTH_TABLE[category ?? FALLBACK_CATEGORY]
  return table[season]
}

/**
 * The i18n key for a category's UVB guidance note. Copy lives under
 * `lighting.uvb.<category>` in the locales so it stays translatable.
 * Reptiles → UVB essential for diurnal baskers; birds → UVA/UVB beneficial for
 * full-spectrum behaviour & D3; amphibians → low-level UVB; arthropods/mammals
 * → generally not required.
 */
export function uvbNoteKey(category: SpeciesCategory | null | undefined): string {
  return `lighting.uvb.${category ?? FALLBACK_CATEGORY}`
}
