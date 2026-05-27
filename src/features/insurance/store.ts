import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface ReserveState {
  monthlyContributionKrw: number
  startedAt: string | null
  setContribution: (value: number) => void
  reset: () => void
}

export const useReserveStore = create<ReserveState>()(
  persist(
    (set) => ({
      monthlyContributionKrw: 0,
      startedAt: null,
      setContribution: (value) =>
        set((state) => ({
          monthlyContributionKrw: Math.max(0, Math.floor(value)),
          startedAt: state.startedAt ?? (value > 0 ? new Date().toISOString() : null),
        })),
      reset: () => set({ monthlyContributionKrw: 0, startedAt: null }),
    }),
    {
      name: 'pettography.reserve',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export function monthsBetween(startedAt: string | null, now: Date = new Date()): number {
  if (!startedAt) return 0
  const start = new Date(startedAt)
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  return Math.max(0, months)
}
