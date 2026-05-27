import { z } from 'zod'

export const linkCategorySchema = z.enum([
  'adoption',
  'shopping',
  'medical',
  'funeral',
  'community',
  'reference',
])
export type LinkCategory = z.infer<typeof linkCategorySchema>

export const LINK_CATEGORIES: readonly LinkCategory[] = [
  'adoption',
  'shopping',
  'medical',
  'funeral',
  'community',
  'reference',
] as const

export const speciesCategorySchema = z.enum([
  'reptile',
  'arthropod',
  'bird',
  'amphibian',
  'mammal',
  'general',
])
export type SpeciesCategory = z.infer<typeof speciesCategorySchema>

export const EXTERNAL_LINK_SPECIES_CATEGORIES: readonly SpeciesCategory[] = [
  'reptile',
  'arthropod',
  'bird',
  'amphibian',
  'mammal',
  'general',
] as const

export const externalLinkSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  description: z.string(),
  category: linkCategorySchema,
  speciesCategories: z.array(speciesCategorySchema).min(1),
  region: z.string().optional(),
  badge: z.string().optional(),
})
export type ExternalLink = z.infer<typeof externalLinkSchema>
