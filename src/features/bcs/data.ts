import type { SpeciesCategory } from '@features/species'

/**
 * One rung of the 1..5 body condition scale. `descKey` is an i18n key that
 * holds a concrete, category-specific visual/palpation cue — resolved in the
 * page so all copy lives in the locale files.
 */
export interface BcsScaleLevel {
  score: number
  descKey: string
}

/** Category buckets we ship descriptions for, plus a generic fallback. */
export type BcsScaleCategory = SpeciesCategory | 'unknown'

function levelsFor(category: BcsScaleCategory): BcsScaleLevel[] {
  return [1, 2, 3, 4, 5].map((score) => ({
    score,
    descKey: `bcs.scale.${category}.${score}`,
  }))
}

/**
 * The 1..5 scale per category. Descriptions (i18n keys) describe what each
 * score looks like for that taxon — e.g. pelvis/spine prominence for reptiles,
 * abdomen size vs prosoma for arthropods, keel prominence for birds.
 */
export const BCS_SCALE: Readonly<Record<BcsScaleCategory, BcsScaleLevel[]>> = {
  reptile: levelsFor('reptile'),
  amphibian: levelsFor('amphibian'),
  arthropod: levelsFor('arthropod'),
  bird: levelsFor('bird'),
  mammal: levelsFor('mammal'),
  unknown: levelsFor('unknown'),
}

/**
 * Returns the five scale descriptions (as i18n keys) for a pet's category,
 * falling back to the generic scale when the category is null/unknown.
 */
export function scaleFor(category: SpeciesCategory | null | undefined): BcsScaleLevel[] {
  if (!category) return BCS_SCALE.unknown
  return BCS_SCALE[category] ?? BCS_SCALE.unknown
}

/** i18n key for the short label of a score (1 매우 마름 … 3 이상 … 5 비만). */
export function scoreLabel(score: number): string {
  const clamped = Math.min(Math.max(Math.round(score), 1), 5)
  return `bcs.scoreLabels.${clamped}`
}
