import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { CbStatus, Listing, MarketRegion } from './schema'
import type { SpeciesCategory } from '@features/species'

interface AddListingInput {
  author: string
  title: string
  speciesId?: string | null
  category?: SpeciesCategory | null
  morph?: string
  isFree: boolean
  priceKrw?: number | null
  region: MarketRegion
  cbStatus: CbStatus
  contact: string
  description: string
}

interface MarketState {
  listings: Listing[]
  ownIds: Record<string, true>
  lastAuthor: string
  seeded: boolean
  hydrateSeed: (seed: readonly Listing[]) => void
  addListing: (input: AddListingInput) => Listing
  removeListing: (id: string) => void
  isOwn: (id: string) => boolean
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      listings: [],
      ownIds: {},
      lastAuthor: '',
      seeded: false,
      hydrateSeed: (seed) =>
        set((state) => {
          if (state.seeded || state.listings.length > 0) return { seeded: true }
          return { listings: [...seed], seeded: true }
        }),
      addListing: (input) => {
        const listing: Listing = {
          id: crypto.randomUUID(),
          author: input.author,
          title: input.title,
          speciesId: input.speciesId ?? null,
          category: input.category ?? null,
          morph: input.morph?.trim() ? input.morph.trim() : '',
          isFree: input.isFree,
          priceKrw: input.isFree ? null : (input.priceKrw ?? null),
          region: input.region,
          cbStatus: input.cbStatus,
          contact: input.contact,
          description: input.description,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          listings: [listing, ...state.listings],
          ownIds: { ...state.ownIds, [listing.id]: true },
          lastAuthor: input.author,
        }))
        return listing
      },
      removeListing: (id) => {
        if (!get().ownIds[id]) return
        set((state) => {
          const nextOwn = { ...state.ownIds }
          delete nextOwn[id]
          return {
            listings: state.listings.filter((l) => l.id !== id),
            ownIds: nextOwn,
          }
        })
      },
      isOwn: (id) => Boolean(get().ownIds[id]),
    }),
    {
      name: 'pettography.market',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
