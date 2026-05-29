import type { CleanType } from './schema'
import type { SpeciesCategory } from '@features/species'

/**
 * Default cleaning cadences (interval in days) per clean type, varying by
 * category where the husbandry consensus differs. Reconstructed from widely
 * cited care references (ReptiFiles, Axolotl.org, bioactive-vivarium guides,
 * parrot/small-mammal husbandry sheets).
 *
 * These are starting points only — the page reminds keepers that a mature
 * bioactive setup needs *less* full/substrate cleaning, not more, because the
 * cleanup crew and plants process waste. Human-facing copy lives in i18n under
 * `cleaning.*`; this module holds numbers and applicability flags.
 *
 * - `spot`: remove visible waste / uneaten food (daily–every 3 days).
 * - `full`: wipe-down / disinfect surfaces (weekly–monthly).
 * - `substrate`: replace or deep-refresh substrate (monthly–quarterly).
 * - `water`: partial water change — mainly aquatic/semi-aquatic (~weekly).
 */

const DEFAULT_INTERVALS: Record<SpeciesCategory, Record<CleanType, number>> = {
  reptile: { spot: 2, full: 14, substrate: 60, water: 7 },
  arthropod: { spot: 3, full: 30, substrate: 90, water: 7 },
  amphibian: { spot: 1, full: 7, substrate: 30, water: 5 },
  bird: { spot: 1, full: 7, substrate: 30, water: 2 },
  mammal: { spot: 1, full: 7, substrate: 21, water: 3 },
}

/** Sensible fallback when no pet/category is selected yet. */
const FALLBACK_INTERVALS: Record<CleanType, number> = {
  spot: 2,
  full: 14,
  substrate: 60,
  water: 7,
}

/** Recommended interval in days for a clean type, scoped to the category. */
export function defaultIntervalDays(
  type: CleanType,
  category: SpeciesCategory | null | undefined,
): number {
  if (category && DEFAULT_INTERVALS[category]) return DEFAULT_INTERVALS[category][type]
  return FALLBACK_INTERVALS[type]
}

/**
 * Whether a water change is a primary, regular concern for the category.
 * The UI shows the `water` row for every pet (a water dish still needs
 * changing), but flags it as primary for aquatic/semi-aquatic keepers so the
 * rest just see it as a gentle reminder rather than a core cadence.
 */
const WATER_PRIMARY: Record<SpeciesCategory, boolean> = {
  reptile: false,
  arthropod: false,
  amphibian: true,
  bird: false,
  mammal: false,
}

export function isWaterPrimary(category: SpeciesCategory | null | undefined): boolean {
  return category ? WATER_PRIMARY[category] : false
}

/**
 * Whether a clean type is a primary cadence for the category. All types apply
 * to everyone, but `water` is only highlighted as primary for aquatics.
 */
export function appliesTo(type: CleanType, category: SpeciesCategory | null | undefined): boolean {
  if (type === 'water') return isWaterPrimary(category)
  return true
}
