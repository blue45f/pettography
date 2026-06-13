import type { SupplementType } from './schema'
import type { SpeciesCategory } from '@features/species'

/**
 * Conservative, widely-cited supplement dusting cadences (ReptiFiles, Reptiles
 * Magazine, Allen Repashy / Arcadia guidance, axolotl/amphibian care sheets).
 * Values are general starting points expressed as "days between dustings"; the
 * page always reminds keepers that the real schedule depends on UVB exposure,
 * the staple diet, and life stage, and to confirm with an exotics vet.
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
 * Per-category defaults. Insectivore reptiles (leopard gecko, juvenile bearded
 * dragon) anchor the reptile row: plain calcium nearly every feeding (~2 days),
 * calcium+D3 once or twice weekly (~4 days), multivitamin weekly (~7 days).
 */
export const CATEGORY_CADENCE: Record<SpeciesCategory, CategoryCadence> = {
  reptile: {
    intervalDays: { calcium: 2, calciumD3: 4, multivitamin: 7 },
    dusts: true,
  },
  amphibian: {
    // Pacman frogs etc.: calcium most feedings, multivitamin weekly; D3 lightly.
    intervalDays: { calcium: 3, calciumD3: 7, multivitamin: 7 },
    dusts: true,
  },
  arthropod: {
    // Tarantulas/scorpions are not dusted — gut-load the feeders instead.
    intervalDays: { calcium: null, calciumD3: null, multivitamin: null },
    dusts: false,
  },
  bird: {
    // Diet-driven; a balanced pellet/veg diet beats heavy supplementation.
    intervalDays: { calcium: 7, calciumD3: null, multivitamin: null },
    dusts: false,
  },
  mammal: {
    // Diet-driven (e.g. sugar gliders/hedgehogs); supplement only on vet advice.
    intervalDays: { calcium: 7, calciumD3: null, multivitamin: null },
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
