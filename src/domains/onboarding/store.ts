import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { Location, OnboardingProfile, PetProfile } from './schema'
import type { SpeciesCategory } from '@domains/species'

interface OnboardingState {
  pets: PetProfile[]
  activePetId: string | null
  completedAt: string | null
  /** Mirror of the active pet, kept for backwards compatibility with
   *  existing pages that read `s.profile`. Updates flow through the
   *  setters below into the matching pet entry. */
  profile: OnboardingProfile

  setPetName: (name: string) => void
  setCategory: (category: SpeciesCategory) => void
  setSpecies: (speciesId: string) => void
  setLocation: (location: Location | null) => void
  complete: () => void
  reset: () => void

  /** Multi-pet controls. */
  addPet: () => PetProfile
  switchPet: (id: string) => void
  removePet: (id: string) => void
  renamePet: (id: string, name: string) => void
}

const EMPTY_PROFILE: OnboardingProfile = {
  petName: null,
  category: null,
  speciesId: null,
  location: null,
  completedAt: null,
}

function makePet(seed?: Partial<PetProfile>): PetProfile {
  return {
    id: seed?.id ?? crypto.randomUUID(),
    petName: seed?.petName ?? null,
    category: seed?.category ?? null,
    speciesId: seed?.speciesId ?? null,
    location: seed?.location ?? null,
    createdAt: seed?.createdAt ?? new Date().toISOString(),
  }
}

function projectProfile(
  pet: PetProfile | undefined,
  completedAt: string | null,
): OnboardingProfile {
  if (!pet) return EMPTY_PROFILE
  return {
    petName: pet.petName ?? null,
    category: pet.category,
    speciesId: pet.speciesId,
    location: pet.location,
    completedAt,
  }
}

function updateActive(
  state: OnboardingState,
  patch: (pet: PetProfile) => PetProfile,
): Partial<OnboardingState> {
  const id = state.activePetId
  if (!id) return {}
  const pets = state.pets.map((p) => (p.id === id ? patch(p) : p))
  const active = pets.find((p) => p.id === id)
  return { pets, profile: projectProfile(active, state.completedAt) }
}

const initialPet = makePet()

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      pets: [initialPet],
      activePetId: initialPet.id,
      completedAt: null,
      profile: projectProfile(initialPet, null),

      setPetName: (name) =>
        set((state) => updateActive(state, (p) => ({ ...p, petName: name.trim() || null }))),

      setCategory: (category) =>
        set((state) =>
          updateActive(state, (p) => ({
            ...p,
            category,
            speciesId: p.category === category ? p.speciesId : null,
          })),
        ),

      setSpecies: (speciesId) => set((state) => updateActive(state, (p) => ({ ...p, speciesId }))),

      setLocation: (location) => set((state) => updateActive(state, (p) => ({ ...p, location }))),

      complete: () =>
        set((state) => {
          const completedAt = new Date().toISOString()
          const active = state.pets.find((p) => p.id === state.activePetId)
          return { completedAt, profile: projectProfile(active, completedAt) }
        }),

      reset: () => {
        const fresh = makePet()
        return set({
          pets: [fresh],
          activePetId: fresh.id,
          completedAt: null,
          profile: projectProfile(fresh, null),
        })
      },

      addPet: () => {
        const pet = makePet()
        set((state) => ({
          pets: [...state.pets, pet],
          activePetId: pet.id,
          completedAt: null,
          profile: projectProfile(pet, null),
        }))
        return pet
      },

      switchPet: (id) =>
        set((state) => {
          const target = state.pets.find((p) => p.id === id)
          if (!target) return {}
          return {
            activePetId: id,
            profile: projectProfile(target, state.completedAt),
          }
        }),

      removePet: (id) =>
        set((state) => {
          if (state.pets.length <= 1) return {}
          const remaining = state.pets.filter((p) => p.id !== id)
          const nextActiveId = state.activePetId === id ? remaining[0].id : state.activePetId
          const active = remaining.find((p) => p.id === nextActiveId)
          return {
            pets: remaining,
            activePetId: nextActiveId,
            profile: projectProfile(active, state.completedAt),
          }
        }),

      renamePet: (id, name) =>
        set((state) => {
          const pets = state.pets.map((p) =>
            p.id === id ? { ...p, petName: name.trim() || null } : p,
          )
          const active = pets.find((p) => p.id === state.activePetId)
          return { pets, profile: projectProfile(active, state.completedAt) }
        }),
    }),
    {
      name: 'pettography.onboarding',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted: unknown, version) => {
        if (version >= 2 && persisted && typeof persisted === 'object') {
          // Validate the shape before trusting it: a corrupted backup that drops
          // pets/activePetId/profile would otherwise crash callers. Fall back to
          // initial state (undefined) when the required fields are malformed.
          const s = persisted as Partial<OnboardingState>
          const valid =
            Array.isArray(s.pets) &&
            (s.activePetId === null || typeof s.activePetId === 'string') &&
            s.profile != null &&
            typeof s.profile === 'object'
          return valid ? (persisted as OnboardingState) : undefined
        }
        // legacy v0/v1: { profile: OnboardingProfile }
        const legacy = persisted as { profile?: OnboardingProfile } | null
        const p = legacy?.profile
        if (!p) return undefined
        const pet = makePet({
          petName: p.petName ?? null,
          category: p.category,
          speciesId: p.speciesId,
          location: p.location,
        })
        return {
          pets: [pet],
          activePetId: pet.id,
          completedAt: p.completedAt,
          profile: projectProfile(pet, p.completedAt),
        } as unknown as OnboardingState
      },
    },
  ),
)

export function isOnboardingComplete(profile: OnboardingProfile): boolean {
  return Boolean(profile.category && profile.speciesId && profile.location && profile.completedAt)
}
