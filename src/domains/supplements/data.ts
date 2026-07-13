import type { SupplementType } from './schema'
import type { SpeciesCategory } from '@domains/species'

/**
 * No automatic supplementation cadence is prescribed. Requirements vary by
 * species, product, diet, life stage, UVB exposure, and clinical status, so a
 * schedule must be confirmed with an exotics veterinarian.
 *
 * A `null` interval means "this type is not routinely used for this category"
 * (e.g. arthropods, where gut-loading the feeders replaces dusting). The page
 * renders such rows as guidance rather than an actionable schedule.
 *
 * Notes & guidance map to `supplements.*` i18n keys so copy renders in the
 * keeper's language.
 */
export interface CategoryCadence {
  /** Days between dustings per type; `null` = not routinely dusted. */
  intervalDays: Record<SupplementType, number | null>
  /** Whether dusting applies at all (false → emphasise gut-loading instead). */
  dusts: boolean
}

/**
 * All defaults are intentionally disabled. The persisted schedule shape remains
 * available for compatibility with calendar/alert consumers, but new users do
 * not receive a medical cadence from category alone.
 */
export const CATEGORY_CADENCE: Record<SpeciesCategory, CategoryCadence> = {
  reptile: {
    intervalDays: { calcium: 2, calciumD3: 4, multivitamin: 7 },
    dusts: true,
  },
  amphibian: {
    intervalDays: { calcium: null, calciumD3: null, multivitamin: null },
    dusts: false,
  },
  arthropod: {
    // Tarantulas/scorpions are not dusted — gut-load the feeders instead.
    intervalDays: { calcium: null, calciumD3: null, multivitamin: null },
    dusts: false,
  },
  bird: {
    intervalDays: { calcium: null, calciumD3: null, multivitamin: null },
    dusts: false,
  },
  mammal: {
    intervalDays: { calcium: null, calciumD3: null, multivitamin: null },
    dusts: false,
  },
}

/** i18n key for the category-specific guidance paragraph shown on the page. */
export function supplementGuidance(category: SpeciesCategory | null | undefined): string {
  if (!category) return 'supplements.guidance.unknown'
  return `supplements.guidance.${category}`
}

/**
 * Default interval (days) for a type given the active category. Returns null
 * when the type is not routinely dusted for that category, or when no category
 * is selected yet.
 */
export function defaultIntervalDays(
  category: SpeciesCategory | null | undefined,
  type: SupplementType
): number | null {
  if (!category) return null
  return CATEGORY_CADENCE[category].intervalDays[type]
}

/** Whether the active category is a dusting category at all. */
export function categoryDusts(category: SpeciesCategory | null | undefined): boolean {
  if (!category) return false
  return CATEGORY_CADENCE[category].dusts
}
