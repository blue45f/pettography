import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { GalleryPhoto, PhotoInput } from './schema'

interface GalleryState {
  photos: GalleryPhoto[]
  addPhoto: (speciesId: string, input: PhotoInput) => GalleryPhoto
  removePhoto: (id: string) => void
}

export const useGalleryStore = create<GalleryState>()(
  persist(
    (set) => ({
      photos: [],
      addPhoto: (speciesId, input) => {
        const photo: GalleryPhoto = {
          id: crypto.randomUUID(),
          petId: useOnboardingStore.getState().activePetId ?? null,
          speciesId,
          imageUrl: input.imageUrl,
          sourceUrl: input.sourceUrl?.trim() || undefined,
          caption: input.caption?.trim() || undefined,
          addedAt: new Date().toISOString(),
        }
        set((state) => ({ photos: [photo, ...state.photos] }))
        return photo
      },
      removePhoto: (id) => set((state) => ({ photos: state.photos.filter((p) => p.id !== id) })),
    }),
    {
      name: 'pettography.gallery.v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export function photosForSpecies(photos: GalleryPhoto[], speciesId: string): GalleryPhoto[] {
  return photos.filter((p) => p.speciesId === speciesId)
}

/**
 * Filters photos strictly for the active pet or the pre-onboarding null slot.
 */
export function useActivePetPhotos(speciesId: string | null | undefined): GalleryPhoto[] {
  const photos = useGalleryStore((s) => s.photos)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  return photos.filter((p) => {
    if (speciesId && p.speciesId !== speciesId) return false
    if (!activePetId) return !p.petId
    return p.petId === activePetId
  })
}
