import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { ExpenseCategory, ExpenseEntry } from './schema'

interface BudgetState {
  entries: ExpenseEntry[]
  addEntry: (input: {
    spentAt: string
    amountKrw: number
    category: ExpenseCategory
    merchant?: string
    note?: string
  }) => ExpenseEntry
  removeEntry: (id: string) => void
  clear: () => void
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: ({ spentAt, amountKrw, category, merchant, note }) => {
        const entry: ExpenseEntry = {
          id: crypto.randomUUID(),
          spentAt,
          amountKrw,
          category,
          merchant,
          note,
        }
        set((state) => ({
          entries: [entry, ...state.entries].sort((a, b) => b.spentAt.localeCompare(a.spentAt)),
        }))
        return entry
      },
      removeEntry: (id) => set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: 'pettography.budget',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export interface MonthBreakdown {
  monthKey: string
  totalKrw: number
  byCategory: Record<ExpenseCategory, number>
  count: number
}

export function monthBreakdown(
  entries: ExpenseEntry[],
  refDate: Date = new Date()
): MonthBreakdown {
  const key = monthKey(refDate)
  const inMonth = entries.filter((e) => monthKey(new Date(e.spentAt)) === key)
  const byCategory: Record<ExpenseCategory, number> = {
    feeding: 0,
    gear: 0,
    medical: 0,
    subscription: 0,
    funeral: 0,
    other: 0,
  }
  let totalKrw = 0
  for (const e of inMonth) {
    byCategory[e.category] += e.amountKrw
    totalKrw += e.amountKrw
  }
  return { monthKey: key, totalKrw, byCategory, count: inMonth.length }
}

export interface BudgetCompare {
  spentKrw: number
  recommendedKrw: number | null
  percent: number | null
  status: 'under' | 'on-track' | 'over'
}

export function compareAgainstRecommended(
  spentKrw: number,
  recommendedKrw: number | null
): BudgetCompare {
  if (!recommendedKrw || recommendedKrw <= 0) {
    return { spentKrw, recommendedKrw, percent: null, status: 'under' }
  }
  const percent = Math.round((spentKrw / recommendedKrw) * 100)
  const status: BudgetCompare['status'] =
    percent < 70 ? 'under' : percent <= 110 ? 'on-track' : 'over'
  return { spentKrw, recommendedKrw, percent, status }
}
