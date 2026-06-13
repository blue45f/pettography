import Badge from '@components/common/Badge'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import { usePetLabel } from '@components/common/PetBadge'
import Sparkline from '@components/common/Sparkline'
import { useBudgetStore } from '@features/budget'
import {
  annualTotal,
  grandTotal,
  monthlyAverage,
  projectedAnnual,
  recordedMonthCount,
  totalsByCategory,
  totalsByMonth,
  totalsByPet,
  useCostReportStore,
  type ReportExpense,
} from '@features/costreport'
import { useOnboardingStore } from '@features/onboarding'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './CostReport.module.css'

const krw = new Intl.NumberFormat('ko-KR')

function formatKrw(value: number): string {
  return `${krw.format(Math.round(value))}원`
}

/** Compact label for the sparkline axis (e.g. 188,000원 → 18.8만원). */
function formatCompactKrw(value: number): string {
  if (value >= 10000) {
    const man = value / 10000
    const rounded = man >= 100 ? Math.round(man) : Math.round(man * 10) / 10
    return `${krw.format(rounded)}만원`
  }
  return `${krw.format(Math.round(value))}원`
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

interface BreakdownRowProps {
  label: string
  amountKrw: number
  maxKrw: number
  totalKrw: number
}

function BreakdownRow({ label, amountKrw, maxKrw, totalKrw }: BreakdownRowProps) {
  const scale = maxKrw > 0 ? amountKrw / maxKrw : 0
  const pct = totalKrw > 0 ? Math.round((amountKrw / totalKrw) * 100) : 0
  return (
    <li className={styles.barRow}>
      <span className={styles.barName}>{label}</span>
      <div className={styles.barTrack}>
        <span
          className={styles.barFill}
          style={{ transform: `scaleX(${scale.toFixed(4)})` }}
          aria-hidden="true"
        />
      </div>
      <span className={styles.barMeta}>
        <span className={styles.barAmount}>{formatKrw(amountKrw)}</span>
        <span className={styles.barPct}>{pct}%</span>
      </span>
    </li>
  )
}

interface PetBreakdownRowProps {
  petId: string | null
  amountKrw: number
  maxKrw: number
  totalKrw: number
  fallbackLabel: string
}

function PetBreakdownRow({
  petId,
  amountKrw,
  maxKrw,
  totalKrw,
  fallbackLabel,
}: PetBreakdownRowProps) {
  const petLabel = usePetLabel(petId)
  const label = petLabel ? `${petLabel.emoji} ${petLabel.name}` : fallbackLabel
  return <BreakdownRow label={label} amountKrw={amountKrw} maxKrw={maxKrw} totalKrw={totalKrw} />
}

function CostReport() {
  const { t } = useTranslation()
  useDocumentTitle(t('costreport.title'))

  const entries = useBudgetStore((s) => s.entries)
  const pets = useOnboardingStore((s) => s.pets)
  const selectedYear = useCostReportStore((s) => s.selectedYear)
  const setSelectedYear = useCostReportStore((s) => s.setSelectedYear)

  // Map budget entries -> engine-friendly shape (decouple from store fields).
  const allExpenses = useMemo<ReportExpense[]>(
    () =>
      entries.map((e) => ({
        amountKrw: e.amountKrw,
        category: e.category,
        month: e.spentAt.slice(0, 7),
        petId: e.petId ?? null,
      })),
    [entries]
  )

  // Years that actually have data, descending.
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    for (const e of allExpenses) {
      const y = Number(e.month.slice(0, 4))
      if (Number.isFinite(y)) years.add(y)
    }
    return [...years].sort((a, b) => b - a)
  }, [allExpenses])

  // Resolve the effective year during render: a persisted year that no longer
  // has data collapses to "all time" without writing back to the store.
  const effectiveYear =
    selectedYear !== null && availableYears.includes(selectedYear) ? selectedYear : null

  const expenses = useMemo(
    () =>
      effectiveYear === null
        ? allExpenses
        : allExpenses.filter((e) => Number(e.month.slice(0, 4)) === effectiveYear),
    [allExpenses, effectiveYear]
  )

  const categoryTotals = useMemo(() => totalsByCategory(expenses), [expenses])
  const monthTotals = useMemo(() => totalsByMonth(expenses), [expenses])
  const petTotals = useMemo(() => totalsByPet(expenses), [expenses])

  const total = useMemo(() => grandTotal(expenses), [expenses])
  const avg = useMemo(() => monthlyAverage(expenses), [expenses])
  const months = useMemo(() => recordedMonthCount(expenses), [expenses])
  const currentYear = new Date(`${todayIso()}T00:00:00Z`).getUTCFullYear()
  const projected = useMemo(() => projectedAnnual(allExpenses, todayIso()), [allExpenses])
  const thisYearTotal = useMemo(
    () => annualTotal(allExpenses, currentYear),
    [allExpenses, currentYear]
  )

  const categoryMax = categoryTotals[0]?.totalKrw ?? 0
  const petMax = petTotals[0]?.totalKrw ?? 0

  const sparkPoints = useMemo(
    () =>
      monthTotals.map((m, i) => ({
        x: i,
        y: m.totalKrw,
        label: m.month,
      })),
    [monthTotals]
  )

  const hasData = allExpenses.length > 0
  const showPetBreakdown = pets.length > 1 && petTotals.length > 1

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('costreport.title')}</h1>
        <p className={styles.subtitle}>{t('costreport.subtitle')}</p>
      </header>

      {!hasData ? (
        <EmptyState
          icon="📊"
          title={t('costreport.empty.title')}
          description={t('costreport.empty.description')}
          action={
            <Link to="/budget" className={styles.ctaLink}>
              {t('costreport.empty.cta')}
            </Link>
          }
        />
      ) : (
        <>
          <div className={styles.controls} role="group" aria-label={t('costreport.yearLabel')}>
            <button
              type="button"
              className={`${styles.yearChip} ${effectiveYear === null ? styles.yearChipActive : ''}`}
              aria-pressed={effectiveYear === null}
              onClick={() => setSelectedYear(null)}
            >
              {t('costreport.allTime')}
            </button>
            {availableYears.map((year) => (
              <button
                key={year}
                type="button"
                className={`${styles.yearChip} ${effectiveYear === year ? styles.yearChipActive : ''}`}
                aria-pressed={effectiveYear === year}
                onClick={() => setSelectedYear(year)}
              >
                {t('costreport.yearChip', { year })}
              </button>
            ))}
          </div>

          <div className={styles.tiles}>
            <Card padding="lg" className={styles.tile}>
              <Card.Body>
                <p className={styles.tileLabel}>{t('costreport.tiles.total')}</p>
                <p className={styles.tileValue}>{formatKrw(total)}</p>
                <p className={styles.tileHint}>
                  {effectiveYear === null
                    ? t('costreport.scope.allTime')
                    : t('costreport.scope.year', { year: effectiveYear })}
                </p>
              </Card.Body>
            </Card>
            <Card padding="lg" className={styles.tile}>
              <Card.Body>
                <p className={styles.tileLabel}>{t('costreport.tiles.monthlyAverage')}</p>
                <p className={styles.tileValue}>{formatKrw(avg)}</p>
                <p className={styles.tileHint}>{t('costreport.perMonth')}</p>
              </Card.Body>
            </Card>
            <Card padding="lg" className={styles.tile}>
              <Card.Body>
                <p className={styles.tileLabel}>
                  {t('costreport.tiles.projected', { year: currentYear })}
                </p>
                <p className={styles.tileValue}>{formatKrw(projected)}</p>
                <p className={styles.tileHint}>
                  {t('costreport.projectedHint', { amount: formatKrw(thisYearTotal) })}
                </p>
              </Card.Body>
            </Card>
            <Card padding="lg" className={styles.tile}>
              <Card.Body>
                <p className={styles.tileLabel}>{t('costreport.tiles.months')}</p>
                <p className={styles.tileValue}>{t('costreport.monthsValue', { n: months })}</p>
                <p className={styles.tileHint}>
                  {t('costreport.entriesHint', { n: expenses.length })}
                </p>
              </Card.Body>
            </Card>
          </div>

          <section aria-labelledby="cr-cat" className={styles.section}>
            <h2 id="cr-cat" className={styles.sectionTitle}>
              {t('costreport.categoryTitle')}
            </h2>
            {categoryTotals.length === 0 ? (
              <EmptyState icon="🗂️" title={t('costreport.noCategory')} headingLevel={3} />
            ) : (
              <ul className={styles.barList}>
                {categoryTotals.map((c) => (
                  <BreakdownRow
                    key={c.category}
                    label={t(`budget.categories.${c.category}`)}
                    amountKrw={c.totalKrw}
                    maxKrw={categoryMax}
                    totalKrw={total}
                  />
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="cr-trend" className={styles.section}>
            <h2 id="cr-trend" className={styles.sectionTitle}>
              {t('costreport.trendTitle')}
            </h2>
            {monthTotals.length < 2 ? (
              <EmptyState icon="📈" title={t('costreport.trendEmpty')} headingLevel={3} />
            ) : (
              <Card padding="lg" className={styles.trendCard}>
                <Card.Body>
                  <Sparkline
                    points={sparkPoints}
                    ariaLabel={t('costreport.trendAria')}
                    formatValue={formatCompactKrw}
                  />
                  <div className={styles.trendRange}>
                    <span>{monthTotals[0].month}</span>
                    <span>{monthTotals[monthTotals.length - 1].month}</span>
                  </div>
                </Card.Body>
              </Card>
            )}
          </section>

          {showPetBreakdown && (
            <section aria-labelledby="cr-pet" className={styles.section}>
              <h2 id="cr-pet" className={styles.sectionTitle}>
                {t('costreport.petTitle')}
              </h2>
              <p className={styles.sectionDesc}>{t('costreport.petDesc')}</p>
              <ul className={styles.barList}>
                {petTotals.map((p) => (
                  <PetBreakdownRow
                    key={p.petId ?? 'unscoped'}
                    petId={p.petId}
                    amountKrw={p.totalKrw}
                    maxKrw={petMax}
                    totalKrw={total}
                    fallbackLabel={t('costreport.unscopedPet')}
                  />
                ))}
              </ul>
            </section>
          )}

          <p className={styles.sectionDesc}>
            <Badge variant="default">{t('costreport.allPetsNote')}</Badge>
          </p>
        </>
      )}
    </section>
  )
}

export default CostReport
