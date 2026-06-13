import type { SpeciesCategory } from '@domains/species'

/**
 * Care-adjustment recommendation ids per species category. Each id resolves to
 * an i18n string at `senior.tips.<id>`. These are the changes a keeper should
 * consider once an animal enters its senior years.
 */
export const SENIOR_CARE_TIPS: Record<SpeciesCategory, readonly string[]> = {
  reptile: [
    'reptileLowerBasking',
    'reptileEasyDecor',
    'reptileVetChecks',
    'reptileWeightAppetite',
    'reptileJointOrgan',
    'reptileHydration',
  ],
  arthropod: [
    'arthropodGentleHandling',
    'arthropodEasyPrey',
    'arthropodLowerClimb',
    'arthropodMoltWatch',
    'arthropodStableHumidity',
  ],
  bird: [
    'birdPerchVariety',
    'birdSoftDiet',
    'birdWarmth',
    'birdVetChecks',
    'birdWeightAppetite',
    'birdGentleRoutine',
  ],
  amphibian: [
    'amphibianWaterQuality',
    'amphibianCoolerTemps',
    'amphibianEasyPrey',
    'amphibianSkinWatch',
    'amphibianGentleHandling',
  ],
  mammal: [
    'mammalSoftBedding',
    'mammalRamps',
    'mammalSoftDiet',
    'mammalVetChecks',
    'mammalWeightAppetite',
    'mammalDentalJoint',
  ],
}

/**
 * Shared senior-care checklist. Each id resolves to `senior.checklist.<id>`.
 * Kept category-agnostic so the completion map stays stable across species.
 */
export const SENIOR_CHECKLIST: readonly string[] = [
  'vetBaseline',
  'weightLog',
  'appetiteWatch',
  'mobilityCheck',
  'habitatAdjust',
  'hydrationCheck',
  'comfortReview',
  'endOfLifePlan',
] as const

/** Tip ids for a category, or an empty list when the category is unknown. */
export function tipsForCategory(category: SpeciesCategory | null | undefined): readonly string[] {
  if (!category) return []
  return SENIOR_CARE_TIPS[category] ?? []
}
