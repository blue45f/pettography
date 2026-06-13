import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface CostReportState {
  /** Selected year, or null for the "all time" view. */
  selectedYear: number | null
  setSelectedYear: (year: number | null) => void
}

export const useCostReportStore = create<CostReportState>()(
  persist(
    (set) => ({
      selectedYear: null,
      setSelectedYear: (year) => set({ selectedYear: year }),
    }),
    {
      name: 'pettography.costreport',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
