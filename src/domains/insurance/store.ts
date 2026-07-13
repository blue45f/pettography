import { useOnboardingStore } from '@domains/onboarding'
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
              startedAt: safeValue === 0 ? null : (state.startedAt ?? new Date().toISOString()),
            }
          }
          const current = state.byPet[id] ?? { monthlyContributionKrw: 0, startedAt: null }
          return {
            byPet: {
              ...state.byPet,
              [id]: {
                monthlyContributionKrw: safeValue,
                startedAt: safeValue === 0 ? null : (current.startedAt ?? new Date().toISOString()),
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
      name: 'pettography.reserve.v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export function useActivePetReserve(): ReserveSnapshot {
  const monthlyContributionKrw = useReserveStore((s) => s.monthlyContributionKrw)
  const startedAt = useReserveStore((s) => s.startedAt)
  const byPet = useReserveStore((s) => s.byPet)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  if (!activePetId) return { monthlyContributionKrw, startedAt }
  return byPet[activePetId] ?? { monthlyContributionKrw: 0, startedAt: null }
}

export function monthsBetween(startedAt: string | null, now: Date = new Date()): number {
  if (!startedAt) return 0
  const start = new Date(startedAt)
  if (Number.isNaN(start.getTime())) return 0
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  return Math.max(0, months)
}
