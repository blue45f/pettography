import type { SpeciesCategory } from '@domains/species'

/**
 * Recommended MINIMUM enclosure footprint per species, in centimetres.
 * `rule` is an i18n key (`enclosure.rules.*`) explaining the sizing logic
 * for that species so the keeper understands the "why" behind the floor.
 *
 * These are floors drawn from common care-sheet guidance, not targets —
 * adult/active animals almost always benefit from going bigger.
 */
export interface MinEnclosure {
  lengthCm: number
  widthCm: number
  heightCm: number
  /** i18n key under `enclosure.rules.*`. */
  rule: string
}

export const MIN_ENCLOSURE: Record<string, MinEnclosure> = {
  // Reptiles
  'leopard-gecko': { lengthCm: 60, widthCm: 40, heightCm: 30, rule: 'floorSpace' },
  'crested-gecko': { lengthCm: 45, widthCm: 45, heightCm: 60, rule: 'tallPriority' },
  'ball-python': { lengthCm: 120, widthCm: 60, heightCm: 60, rule: 'lengthEqualsSnake' },
  'corn-snake': { lengthCm: 120, widthCm: 45, heightCm: 45, rule: 'lengthEqualsSnake' },
  'bearded-dragon': { lengthCm: 120, widthCm: 60, heightCm: 60, rule: 'floorSpace' },
  'russian-tortoise': { lengthCm: 120, widthCm: 60, heightCm: 40, rule: 'floorSpace' },
  'veiled-chameleon': { lengthCm: 60, widthCm: 60, heightCm: 90, rule: 'tallPriority' },

  // Amphibians
  axolotl: { lengthCm: 60, widthCm: 30, heightCm: 30, rule: 'aquaticVolume' },
  'pacman-frog': { lengthCm: 45, widthCm: 45, heightCm: 30, rule: 'floorSpace' },

  // Arthropods
  'mexican-redknee-tarantula': { lengthCm: 30, widthCm: 30, heightCm: 30, rule: 'legSpan' },
  'emperor-scorpion': { lengthCm: 40, widthCm: 30, heightCm: 25, rule: 'floorSpace' },
  'madagascar-hissing-cockroach': { lengthCm: 40, widthCm: 30, heightCm: 30, rule: 'floorSpace' },

  // Birds
  cockatiel: { lengthCm: 60, widthCm: 40, heightCm: 50, rule: 'flightWidth' },
  budgerigar: { lengthCm: 60, widthCm: 40, heightCm: 50, rule: 'flightWidth' },

  // Mammals
  'sugar-glider': { lengthCm: 60, widthCm: 60, heightCm: 120, rule: 'tallPriority' },
  'african-pygmy-hedgehog': { lengthCm: 100, widthCm: 50, heightCm: 40, rule: 'floorSpace' },
}

/**
 * Per-category fallbacks used when the active pet's species has no specific
 * care-sheet entry. Conservative floors keyed to typical genus size.
 */
export const CATEGORY_FALLBACK: Record<SpeciesCategory, MinEnclosure> = {
  reptile: { lengthCm: 90, widthCm: 45, heightCm: 45, rule: 'floorSpace' },
  amphibian: { lengthCm: 45, widthCm: 45, heightCm: 30, rule: 'aquaticVolume' },
  arthropod: { lengthCm: 30, widthCm: 30, heightCm: 30, rule: 'legSpan' },
  bird: { lengthCm: 60, widthCm: 40, heightCm: 50, rule: 'flightWidth' },
  mammal: { lengthCm: 80, widthCm: 50, heightCm: 50, rule: 'floorSpace' },
}

export interface ResolvedMin extends MinEnclosure {
  /** Whether the result came from the species catalog or a category fallback. */
  source: 'species' | 'category'
}

/**
 * Resolves the recommended minimum enclosure for the given species slug,
 * falling back to a per-category floor and finally to a conservative reptile
 * default when neither slug nor category is known.
 */
export function minEnclosure(
  slug: string | null | undefined,
  category: SpeciesCategory | null | undefined
): ResolvedMin {
  if (slug && MIN_ENCLOSURE[slug]) {
    return { ...MIN_ENCLOSURE[slug], source: 'species' }
  }
  if (category && CATEGORY_FALLBACK[category]) {
    return { ...CATEGORY_FALLBACK[category], source: 'category' }
  }
  return { ...CATEGORY_FALLBACK.reptile, source: 'category' }
}
