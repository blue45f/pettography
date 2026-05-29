/**
 * Pure aggregation helpers for the Cost report feature.
 *
 * The page maps budget entries into the minimal {@link ReportExpense} shape
 * before calling these functions, so the engine never depends on the budget
 * store's exact field names. All date math is UTC-based.
 */

/** Normalized expense row the engine operates on. */
export interface ReportExpense {
  /** Amount in KRW (non-negative integer). */
  amountKrw: number
  /** Raw category id (e.g. 'feeding'). */
  category: string
  /** Calendar month as `YYYY-MM`. */
  month: string
  /** Owning pet id, or null for legacy/unscoped entries. */
  petId: string | null
}

export interface CategoryTotal {
  category: string
  totalKrw: number
}

export interface MonthTotal {
  month: string
  totalKrw: number
}

export interface PetTotal {
  petId: string | null
  totalKrw: number
}

/** Year (UTC) of a `YYYY-MM` month string. */
function yearOf(month: string): number {
  return new Date(`${month}-01T00:00:00Z`).getUTCFullYear()
}

/**
 * Sum spend per category, sorted by total descending. Ties keep the order in
 * which the category was first seen so the result is deterministic.
 */
export function totalsByCategory(expenses: ReportExpense[]): CategoryTotal[] {
  const totals = new Map<string, number>()
  for (const e of expenses) {
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amountKrw)
  }
  return [...totals.entries()]
    .map(([category, totalKrw]) => ({ category, totalKrw }))
    .sort((a, b) => b.totalKrw - a.totalKrw)
}

/** Sum spend per `YYYY-MM` month, sorted ascending by month. */
export function totalsByMonth(expenses: ReportExpense[]): MonthTotal[] {
  const totals = new Map<string, number>()
  for (const e of expenses) {
    totals.set(e.month, (totals.get(e.month) ?? 0) + e.amountKrw)
  }
  return [...totals.entries()]
    .map(([month, totalKrw]) => ({ month, totalKrw }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

/** Sum spend per pet, sorted by total descending. */
export function totalsByPet(expenses: ReportExpense[]): PetTotal[] {
  const totals = new Map<string | null, number>()
  for (const e of expenses) {
    totals.set(e.petId, (totals.get(e.petId) ?? 0) + e.amountKrw)
  }
  return [...totals.entries()]
    .map(([petId, totalKrw]) => ({ petId, totalKrw }))
    .sort((a, b) => b.totalKrw - a.totalKrw)
}

/** Total spend across every expense. */
export function grandTotal(expenses: ReportExpense[]): number {
  return expenses.reduce((sum, e) => sum + e.amountKrw, 0)
}

/** Total spend within a single calendar year. */
export function annualTotal(expenses: ReportExpense[], year: number): number {
  return expenses.reduce((sum, e) => (yearOf(e.month) === year ? sum + e.amountKrw : sum), 0)
}

/**
 * Average spend per month that actually has records. Returns 0 when there are
 * no expenses (never divides by zero).
 */
export function monthlyAverage(expenses: ReportExpense[]): number {
  const byMonth = totalsByMonth(expenses)
  if (byMonth.length === 0) return 0
  const sum = byMonth.reduce((acc, m) => acc + m.totalKrw, 0)
  return Math.round(sum / byMonth.length)
}

/** Count of distinct months that have at least one expense. */
export function recordedMonthCount(expenses: ReportExpense[]): number {
  return totalsByMonth(expenses).length
}

/**
 * Projected full-year spend for the current year, extrapolated from the
 * elapsed months so far. Spend in `year` is divided over the number of
 * months that have begun (1-12) and scaled to 12. Returns 0 when there is no
 * spend in the current year.
 */
export function projectedAnnual(expenses: ReportExpense[], todayISO: string): number {
  const today = new Date(`${todayISO.slice(0, 10)}T00:00:00Z`)
  const year = today.getUTCFullYear()
  const elapsedMonths = today.getUTCMonth() + 1 // 1..12
  const spentThisYear = annualTotal(expenses, year)
  if (spentThisYear === 0) return 0
  return Math.round((spentThisYear / elapsedMonths) * 12)
}
