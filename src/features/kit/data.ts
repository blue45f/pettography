import type { SpeciesCategory } from '@features/species'

/**
 * Static catalog for the emergency-preparedness kit (응급 키트).
 *
 * Items are grouped by the kind of emergency they cover. Every id maps to an
 * i18n string: the group id → `kit.groups.<id>`, the item id →
 * `kit.items.<id>`. Nothing here is user-facing text; the page resolves all
 * copy through `t()`.
 */

export interface KitGroup {
  /** Stable group id → `kit.groups.<id>`. */
  id: string
  /** Member item ids → `kit.items.<id>`. */
  itemIds: readonly string[]
}

export const KIT_ITEMS: readonly KitGroup[] = [
  {
    id: 'power',
    itemIds: ['backupHeat', 'thermometer', 'batteries'],
  },
  {
    id: 'transport',
    itemIds: ['carrier', 'insulatedBox', 'heatPack', 'coolPack'],
  },
  {
    id: 'firstAid',
    itemIds: ['sugarWater', 'cleanGauze', 'digitalScale', 'feedingSyringe'],
  },
  {
    id: 'info',
    itemIds: ['vetContact', 'emergencyVet', 'filingDoc', 'careSheet'],
  },
] as const

/** Flat list of every checklist item id, in group order. */
export const ALL_KIT_ITEM_IDS: readonly string[] = KIT_ITEMS.flatMap((g) => g.itemIds)

/**
 * Category-specific preparedness tip. Returns an i18n key under
 * `kit.hints.*` for the active pet's category, or the generic hint when no
 * category is set.
 */
export function categoryHint(category: SpeciesCategory | null | undefined): string {
  switch (category) {
    case 'reptile':
      return 'kit.hints.reptile'
    case 'amphibian':
      return 'kit.hints.amphibian'
    case 'arthropod':
      return 'kit.hints.arthropod'
    case 'bird':
      return 'kit.hints.bird'
    case 'mammal':
      return 'kit.hints.mammal'
    default:
      return 'kit.hints.generic'
  }
}
