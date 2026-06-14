import { speciesCategorySchema } from '@domains/species'
import { z } from 'zod'

/** Where a substrate sits in the layered cross-section, bottom → top. */
export const substrateRoleSchema = z.enum(['drainage', 'barrier', 'substrate', 'topper'])
export type SubstrateRole = z.infer<typeof substrateRoleSchema>

export const SUBSTRATE_ROLES: readonly SubstrateRole[] = [
  'drainage',
  'barrier',
  'substrate',
  'topper',
] as const

/** Cleanup-crew taxon — what eats the waste and keeps the soil alive. */
export const crewKindSchema = z.enum(['isopod', 'springtail', 'other'])
export type CrewKind = z.infer<typeof crewKindSchema>

export const CREW_KINDS: readonly CrewKind[] = ['isopod', 'springtail', 'other'] as const

/** Coarse moisture band shared by crew, plants and species templates. */
export const humidityBandSchema = z.enum(['arid', 'mid', 'humid'])
export type HumidityBand = z.infer<typeof humidityBandSchema>

export const HUMIDITY_BANDS: readonly HumidityBand[] = ['arid', 'mid', 'humid'] as const

/** Light demand for live plants. */
export const plantLightSchema = z.enum(['low', 'med', 'high'])
export type PlantLight = z.infer<typeof plantLightSchema>

export const PLANT_LIGHTS: readonly PlantLight[] = ['low', 'med', 'high'] as const

export type SpeciesCategory = z.infer<typeof speciesCategorySchema>

export interface SubstrateLayer {
  id: string
  name: string
  role: SubstrateRole
  suitsCategories: SpeciesCategory[]
  note: string
}

export interface CleanupCrew {
  id: string
  name: string
  kind: CrewKind
  humidity: HumidityBand
  note: string
}

export interface Plant {
  id: string
  name: string
  light: PlantLight
  humidity: HumidityBand
  note: string
}

export interface SpeciesTemplate {
  /** Aquatic species can't run a terrestrial bioactive build — flagged here. */
  aquatic?: boolean
  tempHotC: number
  tempCoolC: number
  humidityPct: number
  recommendedSubstrateIds: string[]
  recommendedCrewIds: string[]
  recommendedPlantIds: string[]
  tip: string
}

/** A saved bioactive enclosure design. */
export const vivariumBuildSchema = z.object({
  id: z.string(),
  petId: z.string().nullable().optional(),
  speciesId: z.string().nullable(),
  name: z.string().max(80),
  substrateIds: z.array(z.string()),
  crewIds: z.array(z.string()),
  plantIds: z.array(z.string()),
  tempHotC: z.number().nullable().optional(),
  tempCoolC: z.number().nullable().optional(),
  humidityPct: z.number().nullable().optional(),
  notes: z.string().max(500),
  createdAt: z.string(),
})

export type VivariumBuild = z.infer<typeof vivariumBuildSchema>

export const vivariumFormSchema = z.object({
  name: z.string().trim().min(1, 'vivarium.errors.nameRequired').max(80, 'vivarium.errors.nameMax'),
  notes: z.string().trim().max(500, 'vivarium.errors.notesMax').optional(),
})

export type VivariumFormValues = z.infer<typeof vivariumFormSchema>
