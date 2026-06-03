import { z } from 'zod'

/**
 * Framework-free domain enums shared verbatim between the pettography
 * frontend (zod-validated API responses) and backend (NestJS DTO/types).
 *
 * Each enum exports both the zod schema (consumed by the frontend validators)
 * and the inferred string-literal type (consumed by both sides). The backend
 * imports only the *types* via `import type`, so zod never enters its runtime.
 *
 * Shapes here are a pure consolidation of the previously duplicated
 * definitions in `src/features/*` and `backend/src/common/types.ts`.
 * Do not change these value sets without updating both consumers.
 */

export const speciesCategorySchema = z.enum(['reptile', 'arthropod', 'bird', 'amphibian', 'mammal'])
export type SpeciesCategory = z.infer<typeof speciesCategorySchema>

export const SPECIES_CATEGORIES: readonly SpeciesCategory[] = [
  'reptile',
  'arthropod',
  'bird',
  'amphibian',
  'mammal',
] as const

export const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced'])
export type Difficulty = z.infer<typeof difficultySchema>
/** Backend alias kept for verbatim import compatibility. */
export type SpeciesDifficulty = Difficulty

export const spaceNeedSchema = z.enum(['small', 'medium', 'large'])
export type SpaceNeed = z.infer<typeof spaceNeedSchema>

export const handlingToleranceSchema = z.enum(['low', 'medium', 'high'])
export type HandlingTolerance = z.infer<typeof handlingToleranceSchema>

export const activityPatternSchema = z.enum(['nocturnal', 'diurnal', 'mixed'])
export type ActivityPattern = z.infer<typeof activityPatternSchema>

export const filingStatusSchema = z.enum(['white-list', 'regulated', 'unregulated', 'unknown'])
export type FilingStatus = z.infer<typeof filingStatusSchema>

export const shopKindSchema = z.enum(['food', 'equipment', 'both'])
export type ShopKind = z.infer<typeof shopKindSchema>

export const communityKindSchema = z.enum(['forum', 'cafe', 'discord', 'youtube'])
export type CommunityKind = z.infer<typeof communityKindSchema>

export const adoptionKindSchema = z.enum(['rescue', 'breeder', 'cafe', 'marketplace'])
export type AdoptionKind = z.infer<typeof adoptionKindSchema>

export const funeralServiceKindSchema = z.enum(['cremation', 'memorial', 'pickup', 'directory'])
export type FuneralServiceKind = z.infer<typeof funeralServiceKindSchema>

export const partnerKindSchema = z.enum(['shop', 'hospital', 'treat-shop'])
export type PartnerKind = z.infer<typeof partnerKindSchema>

export const partnerStatusSchema = z.enum(['pending', 'approved', 'rejected'])
export type PartnerStatus = z.infer<typeof partnerStatusSchema>

export const vetStatusSchema = z.enum(['online', 'busy', 'offline'])
export type VetStatus = z.infer<typeof vetStatusSchema>

export const vetRoleSchema = z.enum(['user', 'vet'])
export type VetRole = z.infer<typeof vetRoleSchema>
/** Backend alias kept for verbatim import compatibility. */
export type VetMessageRole = VetRole
/** Frontend alias kept for verbatim import compatibility. */
export type VetConsultRole = VetRole

export const registryFilingSchema = z.enum(['keeping', 'transfer', 'death', 'microchip'])
export type RegistryFiling = z.infer<typeof registryFilingSchema>
/** Backend alias kept for verbatim import compatibility. */
export type WildlifeFilingKey = RegistryFiling
