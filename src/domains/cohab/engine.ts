import { CANNIBAL_CATEGORIES, SOLITARY_HARMFUL_SLUGS, isSocial, type ReasonCode } from './data'

import type { CohabResult, CohabSpecies, Verdict } from './schema'

/**
 * Pure, side-effect-free cohabitation rules.
 *
 * Safety-first by design: the default outcome for two exotics sharing an
 * enclosure is `no`. We only soften the verdict when a clear, well-supported
 * exception applies (the pair is the SAME genuinely social species). Mixing two
 * different species is *never* recommended, regardless of how compatible they
 * might superficially seem — disease transfer, mismatched environmental needs,
 * predation, and size disparity make it unsafe.
 */

/**
 * Severity rank for sorting / colouring. Higher = more dangerous. `no` is the
 * worst (do not cohab) and `ok` the safest (social, benefits from a group).
 */
export function verdictSeverity(verdict: Verdict): number {
  switch (verdict) {
    case 'no':
      return 3
    case 'caution':
      return 2
    case 'sameSpeciesOnly':
      return 1
    case 'ok':
      return 0
  }
}

/** De-duplicate reason codes while preserving first-seen order. */
function uniq(codes: ReasonCode[]): string[] {
  return Array.from(new Set<string>(codes))
}

/**
 * Reasons that apply when two DIFFERENT species are being considered together.
 * Always leads off with `mixSpeciesNever`; the rest are layered on by the
 * concrete risks the pairing presents.
 */
function differentSpeciesReasons(a: CohabSpecies, b: CohabSpecies): string[] {
  const codes: ReasonCode[] = ['mixSpeciesNever', 'diseaseRisk', 'differentNeeds']

  // Cross-category pairings (e.g. reptile + arthropod) almost always mean one
  // animal is food or a lethal stressor for the other.
  if (a.category !== b.category) {
    codes.push('predation')
  }

  // A meaningfully larger animal can injure or eat a smaller cohabitant; flag
  // size mismatch whenever an arthropod/amphibian shares space with anything,
  // since these are the classic "got eaten overnight" cases.
  if (
    CANNIBAL_CATEGORIES.includes(a.category) ||
    CANNIBAL_CATEGORIES.includes(b.category) ||
    a.category !== b.category
  ) {
    codes.push('sizeMismatch')
  }

  codes.push('stress')
  return uniq(codes)
}

/**
 * Compute a cohabitation verdict for an ordered pair of species.
 *
 * Rules:
 *  1. Different slug (different species) → `no`. We never recommend mixing.
 *  2. Same species, social → `ok` (benefits from a group) or `sameSpeciesOnly`
 *     when grouping is viable but comes with real caveats (space, sex ratio).
 *  3. Same species, solitary → `no`/`caution`: even conspecifics fight; for
 *     cannibal-prone categories (arthropods, amphibians) it is a hard `no`.
 */
export function cohabVerdict(speciesA: CohabSpecies, speciesB: CohabSpecies): CohabResult {
  // ── 1. Different species ─────────────────────────────────────────
  if (speciesA.slug !== speciesB.slug) {
    return { verdict: 'no', reasonCodes: differentSpeciesReasons(speciesA, speciesB) }
  }

  const slug = speciesA.slug

  // ── 2. Same species, social ──────────────────────────────────────
  if (isSocial(slug)) {
    const codes: ReasonCode[] = ['socialNeedsGroup', 'spaceRequired']

    // Sugar gliders MUST be kept in company; isolation is harmful. They are the
    // clearest "house together" case, so we return `ok`.
    if (SOLITARY_HARMFUL_SLUGS.includes(slug)) {
      codes.push('sexRatio')
      return { verdict: 'ok', reasonCodes: uniq(codes) }
    }

    // Other social species can be grouped, but with same-species caveats.
    codes.push('sameSpeciesGroupOk')
    return { verdict: 'sameSpeciesOnly', reasonCodes: uniq(codes) }
  }

  // ── 3. Same species, solitary ────────────────────────────────────
  // Cannibal-prone categories: keeping two together risks one eating the other.
  if (CANNIBAL_CATEGORIES.includes(speciesA.category)) {
    return {
      verdict: 'no',
      reasonCodes: uniq(['soloMandatory', 'cannibalism', 'territorial', 'stress']),
    }
  }

  // Other solitary species (most reptiles): aggression and stress; strongly
  // discouraged even with the same species.
  return {
    verdict: 'caution',
    reasonCodes: uniq(['soloMandatory', 'territorial', 'stress']),
  }
}
