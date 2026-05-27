import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { OnboardingProfile } from './schema'
import type { SpeciesCategory } from '@features/species'

interface OnboardingState {
  profile: OnboardingProfile
  setPetName: (name: string) => void
  setCategory: (category: SpeciesCategory) => void
  setSpecies: (speciesId: string) => void
  setLocation: (location: OnboardingProfile['location']) => void
  complete: () => void
  reset: () => void
}

const EMPTY_PROFILE: OnboardingProfile = {
  petName: null,
  category: null,
  speciesId: null,
  location: null,
  completedAt: null,
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      profile: EMPTY_PROFILE,
      setPetName: (name) =>
        set((state) => ({ profile: { ...state.profile, petName: name.trim() || null } })),
      setCategory: (category) =>
        set((state) => ({
          profile: {
            ...state.profile,
            category,
            speciesId: state.profile.category === category ? state.profile.speciesId : null,
          },
        })),
      setSpecies: (speciesId) => set((state) => ({ profile: { ...state.profile, speciesId } })),
      setLocation: (location) => set((state) => ({ profile: { ...state.profile, location } })),
      complete: () =>
        set((state) => ({
          profile: { ...state.profile, completedAt: new Date().toISOString() },
        })),
      reset: () => set({ profile: EMPTY_PROFILE }),
    }),
    {
      name: 'pettography.onboarding',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export function isOnboardingComplete(profile: OnboardingProfile): boolean {
  return Boolean(profile.category && profile.speciesId && profile.location && profile.completedAt)
}
