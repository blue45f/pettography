import { z } from 'zod'

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
})

export type Species = z.infer<typeof speciesSchema>
