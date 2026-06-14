import type { SpeciesCategory } from '@domains/species'

/**
 * Very approximate resting RESPIRATORY rate guidance, keyed by category.
 * These are deliberately conservative ballpark ranges from keeper/vet care
 * sheets — resting rate rises sharply with temperature, activity, and stress,
 * and varies a lot between species. Treat strictly as orientation, not a
 * threshold. Each value is an i18n key resolved in the page.
 */
const RESP_GUIDANCE_KEY: Readonly<Record<SpeciesCategory, string>> = {
  reptile: 'vitals.guidance.reptile',
  amphibian: 'vitals.guidance.amphibian',
  bird: 'vitals.guidance.bird',
  mammal: 'vitals.guidance.mammal',
  arthropod: 'vitals.guidance.arthropod',
}

/**
 * Returns the i18n key for the approximate resting respiratory-rate note that
 * matches a pet's category. Falls back to a generic key when category is null.
 */
export function respGuidanceCategory(category: SpeciesCategory | null | undefined): string {
  if (!category) return 'vitals.guidance.unknown'
  return RESP_GUIDANCE_KEY[category] ?? 'vitals.guidance.unknown'
}
