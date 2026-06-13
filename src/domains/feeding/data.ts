import type { SpeciesCategory } from '@domains/species'

/**
 * Curated feeding rules per species, reconstructed from widely-cited husbandry
 * references (Reptiles Magazine, ReptiFiles, World of Ball Pythons, the BIDKA
 * tarantula care sheets, Axolotl.org). Values are general guidance — the page
 * always reminds keepers to adjust to the individual animal and a vet/expert.
 *
 * `preySizeRuleCode` maps to a `feeding.preyRules.<code>` i18n string so the
 * sizing rule of thumb renders in the keeper's language.
 */
export type PreySizeRuleCode =
  | 'betweenEyes'
  | 'bodyWeightPct'
  | 'girthMatch'
  | 'bodyLength'
  | 'greensPlusInsects'

export interface FeedingRule {
  preySizeRuleCode: PreySizeRuleCode
  /** Recommended cadence (days between feedings) for juveniles/hatchlings. */
  frequencyDaysJuvenile: number
  /** Recommended cadence (days between feedings) for adults. */
  frequencyDaysAdult: number
  /** Free-form species note (i18n key under `feeding.rules.<slug>.note`). */
  note: string
}

/**
 * Per-category fallback used when the active species has no bespoke rule. Keeps
 * the calculator useful for any animal the keeper picks, while the note nudges
 * them to verify against a species-specific source.
 */
export const CATEGORY_FALLBACK_RULES: Record<SpeciesCategory, FeedingRule> = {
  reptile: {
    preySizeRuleCode: 'betweenEyes',
    frequencyDaysJuvenile: 2,
    frequencyDaysAdult: 4,
    note: 'feeding.rules.fallback.reptile',
  },
  arthropod: {
    preySizeRuleCode: 'bodyLength',
    frequencyDaysJuvenile: 5,
    frequencyDaysAdult: 10,
    note: 'feeding.rules.fallback.arthropod',
  },
  amphibian: {
    preySizeRuleCode: 'betweenEyes',
    frequencyDaysJuvenile: 2,
    frequencyDaysAdult: 5,
    note: 'feeding.rules.fallback.amphibian',
  },
  bird: {
    preySizeRuleCode: 'greensPlusInsects',
    frequencyDaysJuvenile: 1,
    frequencyDaysAdult: 1,
    note: 'feeding.rules.fallback.bird',
  },
  mammal: {
    preySizeRuleCode: 'greensPlusInsects',
    frequencyDaysJuvenile: 1,
    frequencyDaysAdult: 1,
    note: 'feeding.rules.fallback.mammal',
  },
}

/** Feeding rules keyed by species slug. */
export const FEEDING_RULES: Record<string, FeedingRule> = {
  // ── Constrictor snakes ──────────────────────────────────────────
  // Prey ≈ 1–1.25× girth at the widest point; weight ≈ 10–15% of body weight.
  'ball-python': {
    preySizeRuleCode: 'girthMatch',
    frequencyDaysJuvenile: 7,
    frequencyDaysAdult: 12,
    note: 'feeding.rules.ball-python.note',
  },
  'corn-snake': {
    preySizeRuleCode: 'girthMatch',
    frequencyDaysJuvenile: 7,
    frequencyDaysAdult: 12,
    note: 'feeding.rules.corn-snake.note',
  },
  // ── Geckos ──────────────────────────────────────────────────────
  // Insects no larger than the space between the eyes.
  'leopard-gecko': {
    preySizeRuleCode: 'betweenEyes',
    frequencyDaysJuvenile: 1,
    frequencyDaysAdult: 3,
    note: 'feeding.rules.leopard-gecko.note',
  },
  'crested-gecko': {
    preySizeRuleCode: 'betweenEyes',
    frequencyDaysJuvenile: 1,
    frequencyDaysAdult: 3,
    note: 'feeding.rules.crested-gecko.note',
  },
  // ── Omnivorous lizard ───────────────────────────────────────────
  'bearded-dragon': {
    preySizeRuleCode: 'greensPlusInsects',
    frequencyDaysJuvenile: 1,
    frequencyDaysAdult: 3,
    note: 'feeding.rules.bearded-dragon.note',
  },
  // ── Arthropods ──────────────────────────────────────────────────
  // Prey ≈ body length or smaller; fast during pre-molt.
  'mexican-redknee-tarantula': {
    preySizeRuleCode: 'bodyLength',
    frequencyDaysJuvenile: 7,
    frequencyDaysAdult: 14,
    note: 'feeding.rules.mexican-redknee-tarantula.note',
  },
  'emperor-scorpion': {
    preySizeRuleCode: 'bodyLength',
    frequencyDaysJuvenile: 7,
    frequencyDaysAdult: 14,
    note: 'feeding.rules.emperor-scorpion.note',
  },
  // ── Amphibians ──────────────────────────────────────────────────
  'pacman-frog': {
    preySizeRuleCode: 'betweenEyes',
    frequencyDaysJuvenile: 2,
    frequencyDaysAdult: 5,
    note: 'feeding.rules.pacman-frog.note',
  },
  axolotl: {
    preySizeRuleCode: 'bodyLength',
    frequencyDaysJuvenile: 1,
    frequencyDaysAdult: 3,
    note: 'feeding.rules.axolotl.note',
  },
}

/**
 * Resolve the feeding rule for a species, falling back to the category default
 * when there's no bespoke entry. Returns null only when both the slug and the
 * category are unknown (e.g. no pet selected yet).
 */
export function feedingRule(
  slug: string | null | undefined,
  category: SpeciesCategory | null | undefined,
): FeedingRule | null {
  if (slug && FEEDING_RULES[slug]) return FEEDING_RULES[slug]
  if (category && CATEGORY_FALLBACK_RULES[category]) return CATEGORY_FALLBACK_RULES[category]
  return null
}

/** Whether a species uses the body-weight prey calculator (constrictor snakes). */
export function usesBodyWeightSizing(rule: FeedingRule | null): boolean {
  return rule?.preySizeRuleCode === 'girthMatch' || rule?.preySizeRuleCode === 'bodyWeightPct'
}
