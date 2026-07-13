import { useOnboardingStore } from '@domains/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { HandlingSession, StressSign } from './schema'

interface TamingState {
  sessions: HandlingSession[]
  addSession: (input: {
    petId?: string
    speciesId: string | null
    sessionAt: string
    durationMin: number
    calmness: number
    stressSigns: StressSign[]
    note: string
  }) => HandlingSession
  removeSession: (id: string) => void
  clear: () => void
}

export const useTamingStore = create<TamingState>()(
  persist(
    (set) => ({
      sessions: [],
      addSession: ({ petId, speciesId, sessionAt, durationMin, calmness, stressSigns, note }) => {
        const resolvedPetId = petId ?? useOnboardingStore.getState().activePetId
        if (!resolvedPetId) throw new Error('An active pet is required to add a handling session.')
        const session: HandlingSession = {
          id: crypto.randomUUID(),
          petId: resolvedPetId,
          speciesId,
          sessionAt,
          durationMin,
          calmness,
          stressSigns,
          note,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          sessions: [session, ...state.sessions].sort((a, b) =>
            b.sessionAt.localeCompare(a.sessionAt)
          ),
        }))
        return session
      },
      removeSession: (id) =>
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
      clear: () => set({ sessions: [] }),
    }),
    {
      name: 'pettography.taming.v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/** Handling sessions strictly scoped to the active pet. */
export function useActivePetSessions(): HandlingSession[] {
  const sessions = useTamingStore((s) => s.sessions)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return []
  return sessions.filter((s) => s.petId === activePetId)
}
