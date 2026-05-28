import { speciesCategorySchema } from '@features/species'
import { z } from 'zod'

export const locationSchema = z.object({
  label: z.string(),
  presetId: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
})
export type Location = z.infer<typeof locationSchema>

export const petProfileSchema = z.object({
  id: z.string(),
  petName: z.string().max(40).nullable().optional(),
  category: speciesCategorySchema.nullable(),
  speciesId: z.string().nullable(),
  location: locationSchema.nullable(),
  createdAt: z.string(),
})
export type PetProfile = z.infer<typeof petProfileSchema>

/**
 * Legacy single-profile shape, kept so existing pages that read
 * `useOnboardingStore((s) => s.profile)` continue to work as a mirror
 * of the active pet plus `completedAt`.
 */
export const onboardingProfileSchema = z.object({
  petName: z.string().max(40).nullable().optional(),
  category: speciesCategorySchema.nullable(),
  speciesId: z.string().nullable(),
  location: locationSchema.nullable(),
  completedAt: z.string().nullable(),
})
export type OnboardingProfile = z.infer<typeof onboardingProfileSchema>

export const ONBOARDING_STEPS = ['category', 'species', 'location', 'review'] as const
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]
