import type { SpeciesCategory } from '@features/species'

/**
 * Static checklist catalog for planning a single transport (이동) — distinct
 * from the home emergency kit. Every id maps to an i18n string under
 * `transport.items.<id>`; nothing here is user-facing text. The order is the
 * order shown on each trip card.
 */
export const TRANSPORT_CHECKLIST: readonly string[] = [
  'secureContainer',
  'tempControl',
  'thermometer',
  'coverDark',
  'noFeedBefore',
  'water',
  'secureLid',
  'paperwork',
] as const

/**
 * Category-specific transport tip. Returns an i18n key under
 * `transport.tips.*` for the active pet's category, or the generic tip when no
 * category is set. Pure — safe to call during render.
 */
export function categoryTip(category: SpeciesCategory | null | undefined): string {
  switch (category) {
    case 'reptile':
      return 'transport.tips.reptile'
    case 'amphibian':
      return 'transport.tips.amphibian'
    case 'arthropod':
      return 'transport.tips.arthropod'
    case 'bird':
      return 'transport.tips.bird'
    case 'mammal':
      return 'transport.tips.mammal'
    default:
      return 'transport.tips.generic'
  }
}
