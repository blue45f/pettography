import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Progress from '@components/common/Progress'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  compareAgainstRecommended,
  EXPENSE_CATEGORIES,
  expenseFormSchema,
  monthBreakdown,
  useActivePetBudget,
  useBudgetStore,
  type ExpenseCategory,
  type ExpenseFormValues,
} from '@features/budget'
import { useOnboardingStore } from '@features/onboarding'
import { useSpecies } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Budget.module.css'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_VARIANT: Record<'under' | 'on-track' | 'over', 'success' | 'primary' | 'error'> = {
  under: 'success',
  'on-track': 'primary',
  over: 'error',
}

function Budget() {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('budget.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)
  const entries = useActivePetBudget()
  const addEntry = useBudgetStore((s) => s.addEntry)
  const removeEntry = useBudgetStore((s) => s.removeEntry)

  const breakdown = useMemo(() => monthBreakdown(entries), [entries])
  const compare = useMemo(
    () => compareAgainstRecommended(breakdown.totalKrw, species?.monthlyBudgetKrw ?? null),
    [breakdown.totalKrw, species?.monthlyBudgetKrw]
  )

  const maxCategory = useMemo(
    () => Math.max(...Object.values(breakdown.byCategory), 1),
    [breakdown.byCategory]
  )

  const monthLabel = useMemo(() => {
    const now = new Date()
    return new Intl.DateTimeFormat(i18n.language === 'en' ? 'en' : 'ko', {
      year: 'numeric',
      month: 'long',
    }).format(now)
  }, [i18n.language])

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      spentAt: todayIso(),
      amountKrw: 0,
      category: 'feeding',
      merchant: '',
      note: '',
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    addEntry(values)
    toast(t('budget.save'), 'success')
    form.reset({
      spentAt: todayIso(),
      amountKrw: 0,
      category: values.category,
      merchant: '',
      note: '',
    })
  })

  return (
    <section className={styles.page}>
      <header className={styles.heroHeader}>
        <h1>{t('budget.title')}</h1>
        <p className={styles.subtitle}>{t('budget.subtitle')}</p>
      </header>

      <Card padding="lg" className={styles.summaryCard}>
        <Card.Body>
          <div className={styles.summaryHeader}>
            <div>
              <p className={styles.summaryLabel}>{t('budget.thisMonth', { month: monthLabel })}</p>
              <p className={styles.summaryValue}>₩{breakdown.totalKrw.toLocaleString('ko')}</p>
            </div>
            {compare.recommendedKrw !== null && (
              <Badge variant={STATUS_VARIANT[compare.status]}>
                {t(`budget.status.${compare.status}`)} · {compare.percent}%
              </Badge>
            )}
          </div>

          {compare.recommendedKrw !== null ? (
            <>
              <Progress
                value={Math.min(compare.percent ?? 0, 100)}
                max={100}
                variant={
                  compare.status === 'over'
                    ? 'error'
                    : compare.status === 'on-track'
                      ? 'primary'
                      : 'success'
                }
              />
              <p className={styles.recommendedLine}>
                {t('budget.recommended')}: ₩{compare.recommendedKrw.toLocaleString('ko')} ·{' '}
                {compare.status === 'over'
                  ? `${t('budget.over')} ₩${(breakdown.totalKrw - compare.recommendedKrw).toLocaleString('ko')}`
                  : `${t('budget.remaining')} ₩${(compare.recommendedKrw - breakdown.totalKrw).toLocaleString('ko')}`}
              </p>
            </>
          ) : (
            <p className={styles.recommendedLine}>{t('budget.noSpeciesBudget')}</p>
          )}
        </Card.Body>
      </Card>

      <section aria-labelledby="cats-heading" className={styles.section}>
        <h2 id="cats-heading" className={styles.sectionTitle}>
          {t('budget.categoriesTitle')}
        </h2>
        <ul className={styles.catList}>
          {EXPENSE_CATEGORIES.map((cat) => {
            const amount = breakdown.byCategory[cat]
            const widthPct = (amount / maxCategory) * 100
            return (
              <li key={cat} className={styles.catRow}>
                <span className={styles.catName}>{t(`budget.categories.${cat}`)}</span>
                <div className={styles.catBarTrack}>
                  <span
                    className={styles.catBar}
                    style={{ width: `${widthPct.toFixed(1)}%` }}
                    aria-hidden="true"
                  />
                </div>
                <span className={styles.catAmount}>₩{amount.toLocaleString('ko')}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <Card padding="lg" className={styles.formCard}>
        <Card.Body>
          <h2 className={styles.sectionTitle}>{t('budget.addTitle')}</h2>
          <form onSubmit={onSubmit} className={styles.formGrid} noValidate>
            <Input
              type="date"
              label={t('budget.date')}
              error={
                form.formState.errors.spentAt?.message
                  ? t(form.formState.errors.spentAt.message)
                  : undefined
              }
              {...form.register('spentAt')}
            />
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              step="100"
              label={t('budget.amount')}
              error={
                form.formState.errors.amountKrw?.message
                  ? t(form.formState.errors.amountKrw.message)
                  : undefined
              }
              {...form.register('amountKrw', {
                setValueAs: (v: unknown) => {
                  if (v === '' || v === null || v === undefined) return 0
                  const n = Number(v)
                  return Number.isFinite(n) ? n : 0
                },
              })}
            />
            <Select
              label={t('budget.category')}
              options={EXPENSE_CATEGORIES.map((c) => ({
                value: c,
                label: t(`budget.categories.${c}`),
              }))}
              {...form.register('category')}
            />
            <Input
              label={t('budget.merchant')}
              placeholder={t('budget.merchantPlaceholder')}
              {...form.register('merchant')}
            />
            <Textarea rows={2} label={t('budget.note')} {...form.register('note')} />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary">
                {t('budget.save')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      <section aria-labelledby="recent-heading" className={styles.section}>
        <h2 id="recent-heading" className={styles.sectionTitle}>
          {t('budget.recentTitle')}
        </h2>
        {entries.length === 0 ? (
          <EmptyState icon="💸" title={t('budget.empty')} />
        ) : (
          <ul className={styles.recentList}>
            {entries.slice(0, 10).map((e) => (
              <li key={e.id} className={styles.recentItem}>
                <span className={styles.recentDate}>{e.spentAt}</span>
                <Badge variant="primary">
                  {t(`budget.categories.${e.category as ExpenseCategory}`)}
                </Badge>
                <strong className={styles.recentAmount}>₩{e.amountKrw.toLocaleString('ko')}</strong>
                <span className={styles.recentMerchant}>{e.merchant ?? ''}</span>
                <span className={styles.recentNote}>{e.note ?? ''}</span>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeEntry(e.id)}
                >
                  {t('budget.remove')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}

export default Budget
