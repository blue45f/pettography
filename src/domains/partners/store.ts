import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { PartnerApplication, PartnerKind, PartnerStatus } from './schema'

interface PartnersState {
  applications: PartnerApplication[]
  apply: (input: {
    kind: PartnerKind
    name: string
    contact: string
    region: string
    description: string
    url?: string | null
  }) => PartnerApplication
  setStatus: (id: string, status: PartnerStatus) => void
  remove: (id: string) => void
}

export const usePartnersStore = create<PartnersState>()(
  persist(
    (set) => ({
      applications: [],
      apply: (input) => {
        const app: PartnerApplication = {
          id: crypto.randomUUID(),
          ...input,
          url: input.url ?? null,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ applications: [app, ...state.applications] }))
        return app
      },
      setStatus: (id, status) =>
        set((state) => ({
          applications: state.applications.map((a) => (a.id === id ? { ...a, status } : a)),
        })),
      remove: (id) =>
        set((state) => ({ applications: state.applications.filter((a) => a.id !== id) })),
    }),
    {
      name: 'pettography.partners.v2',
      version: 2,
      storage: createJSONStorage(() => localStorage),
    }
  )
)
