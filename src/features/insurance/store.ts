import { useOnboardingStore } from '@features/onboarding'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface ReserveSnapshot {
  monthlyContributionKrw: number
  startedAt: string | null
}

interface ReserveState extends ReserveSnapshot {
  /** Per-pet reserves keyed by pet id. */
  byPet: Record<string, ReserveSnapshot>
  setContribution: (value: number) => void
  reset: () => void
}

function activeId(): string | null {
  return useOnboardingStore.getState().activePetId ?? null
}

export const useReserveStore = create<ReserveState>()(
  persist(
    (set) => ({
      monthlyContributionKrw: 0,
      startedAt: null,
      byPet: {},
      setContribution: (value) =>
        set((state) => {
          const id = activeId()
          const safeValue = Math.max(0, Math.floor(value))
          if (!id) {
            return {
              monthlyContributionKrw: safeValue,
              startedAt: state.startedAt ?? (safeValue > 0 ? new Date().toISOString() : null),
            }
          }
          const current = state.byPet[id] ?? {
            monthlyContributionKrw: state.monthlyContributionKrw,
            startedAt: state.startedAt,
          }
          return {
            byPet: {
              ...state.byPet,
              [id]: {
                monthlyContributionKrw: safeValue,
                startedAt: current.startedAt ?? (safeValue > 0 ? new Date().toISOString() : null),
              },
            },
          }
        }),
      reset: () =>
        set((state) => {
          const id = activeId()
          if (!id) return { monthlyContributionKrw: 0, startedAt: null }
          const next = { ...state.byPet }
          delete next[id]
          return { byPet: next }
        }),
    }),
    {
      name: 'pettography.reserve',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export function useActivePetReserve(): ReserveSnapshot {
  const top = useReserveStore((s) => ({
    monthlyContributionKrw: s.monthlyContributionKrw,
    startedAt: s.startedAt,
  }))
  const byPet = useReserveStore((s) => s.byPet)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return top
  return byPet[activePetId] ?? top
}

export function monthsBetween(startedAt: string | null, now: Date = new Date()): number {
  if (!startedAt) return 0
  const start = new Date(startedAt)
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  return Math.max(0, months)
}
