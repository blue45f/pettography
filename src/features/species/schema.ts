import {
  speciesCategorySchema,
  difficultySchema,
  spaceNeedSchema,
  handlingToleranceSchema,
  activityPatternSchema,
  filingStatusSchema,
} from '@pettography/shared'
import { z } from 'zod'

// Shared domain enums live in the framework-free @pettography/shared workspace
// package and are consumed verbatim by both the frontend and backend. They are
// re-exported here so the established @features/species barrel stays stable.
export {
  speciesCategorySchema,
  SPECIES_CATEGORIES,
  difficultySchema,
  spaceNeedSchema,
  handlingToleranceSchema,
  activityPatternSchema,
  filingStatusSchema,
} from '@pettography/shared'
export type {
  SpeciesCategory,
  Difficulty,
  SpaceNeed,
  HandlingTolerance,
  ActivityPattern,
  FilingStatus,
} from '@pettography/shared'

export const speciesSchema = z.object({
  id: z.string(),
  slug: z.string(),
  koreanName: z.string(),
  scientificName: z.string(),
  category: speciesCategorySchema,
  difficulty: difficultySchema,
  lifespanMinYears: z.number().int().nonnegative(),
  lifespanMaxYears: z.number().int().nonnegative(),
  summary: z.string(),
  environment: z.string(),
  diet: z.string(),
  heroEmoji: z.string(),
  tags: z.array(z.string()),
  spaceNeed: spaceNeedSchema,
  handlingTolerance: handlingToleranceSchema,
  activityPattern: activityPatternSchema,
  beginnerTip: z.string(),
  commonProblem: z.string(),
  monthlyBudgetKrw: z.number().int().nonnegative(),
  filingStatus: filingStatusSchema.optional(),
})

export type Species = z.infer<typeof speciesSchema>
