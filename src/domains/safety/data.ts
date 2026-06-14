import type { SpeciesCategory } from '@domains/species'

/**
 * Static catalog for the enclosure safety audit (안전 점검).
 *
 * Items are grouped by the kind of hazard they prevent. Nothing here is
 * user-facing text: every group id maps to `safety.groups.<id>`, every item id
 * to `safety.items.<id>`, and every risk key under `safety.risks.<id>`. The
 * page resolves all copy through `t()`.
 */

export interface SafetyGroup {
  /** Stable group id → `safety.groups.<id>`. */
  id: string
  /** Member item ids → `safety.items.<id>`. */
  itemIds: readonly string[]
}

export const SAFETY_ITEMS: readonly SafetyGroup[] = [
  {
    // 탈출 방지
    id: 'escape',
    itemIds: ['secureLid', 'noGaps', 'screenSecure', 'heightEscape'],
  },
  {
    // 열·화상
    id: 'thermal',
    itemIds: ['heatGuard', 'thermostat', 'noDirectContact', 'tempGradient'],
  },
  {
    // 전기
    id: 'electrical',
    itemIds: ['cordsManaged', 'gfci', 'noFrayed'],
  },
  {
    // 물리·익사
    id: 'physical',
    itemIds: ['noSharpDecor', 'stableDecor', 'waterDepth', 'escapeRamp'],
  },
] as const

/** Flat list of every checklist item id, in group order. */
export const ALL_SAFETY_ITEM_IDS: readonly string[] = SAFETY_ITEMS.flatMap((g) => g.itemIds)

/**
 * Category-specific hazards to surface as callouts. Returns i18n keys under
 * `safety.risks.*` for the active pet's category; the generic set when no
 * category is set.
 */
export function categoryRisks(category: SpeciesCategory | null | undefined): readonly string[] {
  switch (category) {
    case 'reptile':
      // arboreal/climbing escapes + heat-source burns dominate reptile setups
      return ['safety.risks.heightEscape', 'safety.risks.heatBurn', 'safety.risks.gapEscape']
    case 'amphibian':
      // moist skin: drowning depth + toxic residue are the big ones
      return ['safety.risks.waterDepth', 'safety.risks.toxins', 'safety.risks.escapeRamp']
    case 'arthropod':
      // a fall can rupture the abdomen; ventilation gaps let them out
      return ['safety.risks.fallHeight', 'safety.risks.abdomenRupture', 'safety.risks.gapEscape']
    case 'bird':
      // airways are extremely sensitive to fumes (PTFE/Teflon, aerosols)
      return ['safety.risks.toxicFumes', 'safety.risks.teflon', 'safety.risks.barSpacing']
    case 'mammal':
      // chewing through cords + wire-spacing trapping limbs
      return ['safety.risks.chewedCords', 'safety.risks.barSpacing', 'safety.risks.escapeRamp']
    default:
      return ['safety.risks.generic', 'safety.risks.heatBurn', 'safety.risks.gapEscape']
  }
}
