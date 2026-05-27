import { speciesCategorySchema } from '@features/species'
import { z } from 'zod'

export const onboardingProfileSchema = z.object({
  petName: z.string().max(40).nullable().optional(),
  category: speciesCategorySchema.nullable(),
  speciesId: z.string().nullable(),
  location: z
    .object({
      label: z.string(),
      presetId: z.string().nullable(),
      lat: z.number(),
      lng: z.number(),
    })
    .nullable(),
  completedAt: z.string().nullable(),
})

export type OnboardingProfile = z.infer<typeof onboardingProfileSchema>

export const ONBOARDING_STEPS = ['category', 'species', 'location', 'review'] as const
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]
