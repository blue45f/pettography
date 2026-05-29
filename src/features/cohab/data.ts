/**
 * Static catalog for the cohabitation (합사) checker.
 *
 * The guiding principle, reflected in these sets, is that the vast majority of
 * exotic pets are SOLITARY and must be housed alone. Cohabitation — even with
 * the same species — commonly causes chronic stress, territorial aggression,
 * cannibalism, and rapid disease spread. Only a small, well-documented group of
 * genuinely social species benefits from being kept together, and even then
 * only with conspecifics (never mixed with other species) and ample space.
 *
 * Slugs match `@features/species` (see `speciesMock`). All human-readable copy
 * lives in i18n under `cohab.*`; nothing here is user-facing text.
 */

/**
 * Species that MUST be kept alone. The default assumption for any exotic not
 * explicitly listed as social is "solitary", so this list is the documented
 * subset of our catalog rather than an exhaustive universe.
 */
export const SOLITARY_SLUGS: readonly string[] = [
  'ball-python',
  'corn-snake',
  'leopard-gecko',
  'crested-gecko',
  'bearded-dragon',
  'veiled-chameleon',
  'russian-tortoise',
  'mexican-redknee-tarantula',
  'emperor-scorpion',
  'pacman-frog',
  'axolotl',
  'african-pygmy-hedgehog',
] as const

/**
 * Genuinely social species that can — and in some cases SHOULD — be kept in
 * same-species groups with proper space and (for some) the right sex ratio.
 * Sugar gliders in particular suffer when isolated.
 */
export const SOCIAL_SLUGS: readonly string[] = [
  'budgerigar',
  'cockatiel',
  'sugar-glider',
  'madagascar-hissing-cockroach',
] as const

/**
 * Social species for which solitary housing is actively harmful (depression,
 * self-mutilation). Used to phrase the same-species verdict more strongly.
 */
export const SOLITARY_HARMFUL_SLUGS: readonly string[] = ['sugar-glider'] as const

export function isSolitary(slug: string): boolean {
  return SOLITARY_SLUGS.includes(slug)
}

export function isSocial(slug: string): boolean {
  return SOCIAL_SLUGS.includes(slug)
}

/**
 * Stable reason-code ids. Each maps to `cohab.reasons.<id>` for display. They
 * describe *why* a verdict was reached so the UI can list concrete risks.
 */
export const REASON_CODES = [
  'mixSpeciesNever',
  'territorial',
  'cannibalism',
  'sizeMismatch',
  'diseaseRisk',
  'differentNeeds',
  'stress',
  'predation',
  'socialNeedsGroup',
  'sameSpeciesGroupOk',
  'spaceRequired',
  'sexRatio',
  'soloMandatory',
] as const

export type ReasonCode = (typeof REASON_CODES)[number]

/** Categories where same-species cohabitation tends toward cannibalism. */
export const CANNIBAL_CATEGORIES: readonly string[] = ['arthropod', 'amphibian'] as const
