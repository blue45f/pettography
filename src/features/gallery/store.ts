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
      name: 'pettography.gallery',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export function photosForSpecies(photos: GalleryPhoto[], speciesId: string): GalleryPhoto[] {
  return photos.filter((p) => p.speciesId === speciesId)
}
