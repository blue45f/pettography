import { useOnboardingStore } from '@features/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { HandlingSession, StressSign } from './schema'

interface TamingState {
  sessions: HandlingSession[]
  addSession: (input: {
    petId?: string | null
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
        const resolvedPetId =
          petId === undefined ? useOnboardingStore.getState().activePetId : petId
        const session: HandlingSession = {
          id: crypto.randomUUID(),
          petId: resolvedPetId ?? null,
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
            b.sessionAt.localeCompare(a.sessionAt),
          ),
        }))
        return session
      },
      removeSession: (id) =>
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
      clear: () => set({ sessions: [] }),
    }),
    {
      name: 'pettography.taming',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/**
 * Handling sessions scoped to the active pet. Legacy sessions with no petId
 * fall through to the active pet so pre-multi-pet data keeps showing up.
 */
export function useActivePetSessions(): HandlingSession[] {
  const sessions = useTamingStore((s) => s.sessions)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return sessions
  return sessions.filter((s) => !s.petId || s.petId === activePetId)
}
