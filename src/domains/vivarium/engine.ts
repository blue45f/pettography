import { CLEANUP_CREW, PLANTS, SUBSTRATE_LAYERS } from './data'

import type { HumidityBand, SpeciesCategory, SubstrateRole, VivariumBuild } from './schema'

/** Just the selections the engine needs — keeps helpers easy to test. */
export interface BuildSelection {
  substrateIds: string[]
  crewIds: string[]
  plantIds: string[]
  humidityPct?: number | null
}

export type MaintenanceLevel = 'low' | 'medium' | 'high'

/** Stable factor codes; the page maps each to a t('vivarium.factors.*') string. */
export type MaintenanceFactor =
  | 'hasCrew'
  | 'hasPlants'
  | 'goodLitter'
  | 'balancedCrew'
  | 'noDrainage'
  | 'noCrew'
  | 'noPlants'

export interface MaintenanceResult {
  score: number
  level: MaintenanceLevel
  factors: MaintenanceFactor[]
}

/** Readiness checklist item ids; mapped to t('vivarium.checklist.*') on the page. */
export type ChecklistId = 'hasDrainage' | 'hasSubstrate' | 'hasCrew' | 'hasPlants' | 'hasTopper'

export interface ChecklistItem {
  id: ChecklistId
  ok: boolean
}

function rolesOf(substrateIds: string[]): Set<SubstrateRole> {
  const roles = new Set<SubstrateRole>()
  for (const id of substrateIds) {
    const layer = SUBSTRATE_LAYERS.find((s) => s.id === id)
    if (layer) roles.add(layer.role)
  }
  return roles
}

function hasLeafLitter(substrateIds: string[]): boolean {
  return substrateIds.includes('sub-leaf-litter')
}

function crewKinds(crewIds: string[]): Set<string> {
  const kinds = new Set<string>()
  for (const id of crewIds) {
    const crew = CLEANUP_CREW.find((c) => c.id === id)
    if (crew) kinds.add(crew.kind)
  }
  return kinds
}

/** Coarse moisture band for a category — drives "is this a humid build?" logic. */
export function humidityProfileForCategory(
  category: SpeciesCategory | null | undefined
): HumidityBand {
  switch (category) {
    case 'amphibian':
      return 'humid'
    case 'arthropod':
      return 'mid'
    case 'reptile':
    case 'bird':
    case 'mammal':
      return 'mid'
    default:
      return 'mid'
  }
}

/** A build counts as "humid" when its set humidity is high (≥ 65%). */
function isHumidBuild(humidityPct?: number | null): boolean {
  return typeof humidityPct === 'number' && humidityPct >= 65
}

/**
 * Maintenance score 0–100 where HIGHER means LESS day-to-day work: a richer
 * cleanup crew, live plants and leaf litter make the enclosure more
 * self-sustaining, while a humid build with no drainage drives work up.
 */
export function maintenanceScore(build: BuildSelection): MaintenanceResult {
  const factors: MaintenanceFactor[] = []
  let score = 35 // a bare enclosure still needs steady manual upkeep

  const hasCrew = build.crewIds.length > 0
  const hasPlants = build.plantIds.length > 0
  const litter = hasLeafLitter(build.substrateIds)
  const roles = rolesOf(build.substrateIds)
  const kinds = crewKinds(build.crewIds)

  if (hasCrew) {
    score += 25
    factors.push('hasCrew')
  } else {
    factors.push('noCrew')
  }

  if (hasPlants) {
    score += 15
    factors.push('hasPlants')
  } else {
    factors.push('noPlants')
  }

  if (litter) {
    score += 15
    factors.push('goodLitter')
  }

  // Isopods + springtails cover both detritus and mould — a complete crew.
  if (kinds.has('isopod') && kinds.has('springtail')) {
    score += 10
    factors.push('balancedCrew')
  }

  // A humid build with no drainage layer waterlogs and needs constant fussing.
  if (isHumidBuild(build.humidityPct) && !roles.has('drainage')) {
    score -= 25
    factors.push('noDrainage')
  }

  score = Math.min(100, Math.max(0, score))

  const level: MaintenanceLevel = score >= 70 ? 'low' : score >= 45 ? 'medium' : 'high'

  return { score, level, factors }
}

/** Bioactive-readiness checklist. ids map to t() on the page. */
export function readinessChecklist(build: BuildSelection): ChecklistItem[] {
  const roles = rolesOf(build.substrateIds)
  return [
    { id: 'hasDrainage', ok: roles.has('drainage') },
    { id: 'hasSubstrate', ok: roles.has('substrate') },
    { id: 'hasCrew', ok: build.crewIds.length > 0 },
    { id: 'hasPlants', ok: build.plantIds.length > 0 },
    { id: 'hasTopper', ok: roles.has('topper') },
  ]
}

/** Convenience for the diagram: selected substrate ids sorted bottom → top. */
const ROLE_ORDER: Record<SubstrateRole, number> = {
  drainage: 0,
  barrier: 1,
  substrate: 2,
  topper: 3,
}

export function orderedLayers(substrateIds: string[]): SubstrateRole[] {
  return Array.from(rolesOf(substrateIds)).sort((a, b) => ROLE_ORDER[a] - ROLE_ORDER[b])
}

export function fromBuild(build: VivariumBuild): BuildSelection {
  return {
    substrateIds: build.substrateIds,
    crewIds: build.crewIds,
    plantIds: build.plantIds,
    humidityPct: build.humidityPct,
  }
}

// Re-exported so consumers can reference catalog sizes without a second import.
export const CATALOG_SIZES = {
  substrates: SUBSTRATE_LAYERS.length,
  crew: CLEANUP_CREW.length,
  plants: PLANTS.length,
} as const
