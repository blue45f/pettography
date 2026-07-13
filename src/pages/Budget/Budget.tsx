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
  EXPENSE_CATEGORIES,
  compareAgainstRecommended,
  expenseFormSchema,
  monthBreakdown,
  useActivePetBudget,
  useBudgetStore,
  type ExpenseCategory,
  type ExpenseFormValues,
} from '@domains/budget'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpecies } from '@domains/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Budget.module.css'

function localTodayIso(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function Budget() {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('budget.title'))

  const profile = useOnboardingStore((state) => state.profile)
  const activePetId = useOnboardingStore((state) => state.activePetId)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)
  const entries = useActivePetBudget()
  const addEntry = useBudgetStore((state) => state.addEntry)
  const removeEntry = useBudgetStore((state) => state.removeEntry)
  const today = localTodayIso()
  const locale = i18n.resolvedLanguage ?? 'ko-KR'
  const currency = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0,
      }),
    [locale]
  )

  const breakdown = useMemo(() => monthBreakdown(entries), [entries])
  const reference = useMemo(
    () => compareAgainstRecommended(breakdown.totalKrw, species?.monthlyBudgetKrw ?? null),
    [breakdown.totalKrw, species?.monthlyBudgetKrw]
  )
  const maxCategory = useMemo(
    () => Math.max(...Object.values(breakdown.byCategory), 1),
    [breakdown.byCategory]
  )
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(new Date()),
    [locale]
  )

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      spentAt: today,
      amountKrw: 0,
      category: 'feeding',
      merchant: '',
      note: '',
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    if (!activePetId) return
    addEntry({ ...values, petId: activePetId })
    toast(t('budget.save'), 'success')
    form.reset({
      spentAt: today,
      amountKrw: 0,
      category: values.category,
      merchant: '',
      note: '',
    })
  })

  function handleRemove(id: string) {
    if (!window.confirm(t('budget.removeConfirm'))) return
    removeEntry(id)
    toast(t('budget.removed'), 'info')
  }

  if (!activePetId) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{t('budget.eyebrow')}</p>
          <h1>{t('budget.title')}</h1>
          <p className={styles.subtitle}>{t('budget.subtitle')}</p>
        </header>
        <Card padding="lg" className={styles.petGate}>
          <Card.Body>
            <span className={styles.gateIcon} aria-hidden="true">
              ₩
            </span>
            <h2>{t('budget.petRequiredTitle')}</h2>
            <p>{t('budget.petRequiredBody')}</p>
            <Link to="/onboarding" className={styles.primaryLink}>
              {t('budget.petRequiredAction')}
            </Link>
          </Card.Body>
        </Card>
      </section>
    )
  }

  const difference =
    reference.recommendedKrw === null ? null : breakdown.totalKrw - reference.recommendedKrw

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('budget.eyebrow')}</p>
        <h1>{t('budget.title')}</h1>
        <p className={styles.subtitle}>{t('budget.subtitle')}</p>
        <span className={styles.petPill}>
          <span aria-hidden="true">{species?.heroEmoji ?? '🐾'}</span>
          {t('budget.activePet', {
            name: profile.petName?.trim() || species?.koreanName || t('budget.aPet'),
          })}
        </span>
      </header>

      <div className={styles.summaryGrid}>
        <Card padding="lg" className={styles.totalCard}>
          <Card.Body>
            <p className={styles.summaryLabel}>{t('budget.thisMonth', { month: monthLabel })}</p>
            <p className={styles.summaryValue}>{currency.format(breakdown.totalKrw)}</p>
            <p className={styles.summaryMeta}>
              {t('budget.entryCount', { count: breakdown.count })}
            </p>
          </Card.Body>
        </Card>

        <Card padding="lg" className={styles.referenceCard}>
          <Card.Body>
            <div className={styles.referenceHead}>
              <div>
                <p className={styles.summaryLabel}>{t('budget.catalogReference')}</p>
                <p className={styles.referenceValue}>
                  {reference.recommendedKrw === null
                    ? t('budget.noSpeciesBudget')
                    : currency.format(reference.recommendedKrw)}
                </p>
              </div>
              {reference.percent !== null && (
                <Badge variant="default">
                  {t('budget.referenceRatio', { pct: reference.percent })}
                </Badge>
              )}
            </div>
            {reference.percent !== null && (
              <Progress
                value={Math.min(reference.percent, 100)}
                max={100}
                variant="primary"
                label={t('budget.referenceRatioAria', { pct: reference.percent })}
              />
            )}
            {difference !== null && (
              <p className={styles.differenceLine}>
                {difference > 0
                  ? t('budget.aboveReference', { amount: currency.format(difference) })
                  : t('budget.belowReference', { amount: currency.format(Math.abs(difference)) })}
              </p>
            )}
            <p className={styles.referenceNote}>{t('budget.referenceNote')}</p>
          </Card.Body>
        </Card>
      </div>

      <section aria-labelledby="budget-categories" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 id="budget-categories" className={styles.sectionTitle}>
            {t('budget.categoriesTitle')}
          </h2>
          <Link to="/costreport" className={styles.textLink}>
            {t('budget.openReport')}
          </Link>
        </div>
        <ul className={styles.categoryList}>
          {EXPENSE_CATEGORIES.map((category) => {
            const amount = breakdown.byCategory[category]
            const width = (amount / maxCategory) * 100
            return (
              <li key={category} className={styles.categoryRow}>
                <span className={styles.categoryName}>{t(`budget.categories.${category}`)}</span>
                <div className={styles.categoryTrack} aria-hidden="true">
                  <span className={styles.categoryBar} style={{ width: `${width.toFixed(1)}%` }} />
                </div>
                <span className={styles.categoryAmount}>{currency.format(amount)}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <Card padding="lg">
        <Card.Body>
          <p className={styles.sectionKicker}>{t('budget.formKicker')}</p>
          <h2 className={styles.sectionTitle}>{t('budget.addTitle')}</h2>
          <form onSubmit={onSubmit} className={styles.formGrid} noValidate>
            <Input
              type="date"
              max={today}
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
              max="1000000000"
              step="100"
              label={t('budget.amount')}
              error={
                form.formState.errors.amountKrw?.message
                  ? t(form.formState.errors.amountKrw.message)
                  : undefined
              }
              {...form.register('amountKrw', {
                setValueAs: (value: unknown) => {
                  if (value === '' || value === null || value === undefined) return 0
                  const parsed = Number(value)
                  return Number.isFinite(parsed) ? parsed : 0
                },
              })}
            />
            <Select
              label={t('budget.category')}
              options={EXPENSE_CATEGORIES.map((category) => ({
                value: category,
                label: t(`budget.categories.${category}`),
              }))}
              {...form.register('category')}
            />
            <Input
              label={t('budget.merchant')}
              maxLength={80}
              autoComplete="off"
              placeholder={t('budget.merchantPlaceholder')}
              error={
                form.formState.errors.merchant?.message
                  ? t(form.formState.errors.merchant.message)
                  : undefined
              }
              {...form.register('merchant')}
            />
            <Textarea
              rows={2}
              maxLength={200}
              label={t('budget.note')}
              error={
                form.formState.errors.note?.message
                  ? t(form.formState.errors.note.message)
                  : undefined
              }
              {...form.register('note')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary">
                {t('budget.save')}
              </Button>
            </div>
          </form>
          <p className={styles.privateNote}>{t('budget.privateNote')}</p>
        </Card.Body>
      </Card>

      <section aria-labelledby="budget-recent" className={styles.section}>
        <h2 id="budget-recent" className={styles.sectionTitle}>
          {t('budget.recentTitle')}
        </h2>
        {entries.length === 0 ? (
          <EmptyState icon="💸" title={t('budget.empty')} />
        ) : (
          <ul className={styles.recentList}>
            {entries.slice(0, 10).map((entry) => (
              <li key={entry.id} className={styles.recentItem}>
                <div className={styles.recentMain}>
                  <div className={styles.recentTopline}>
                    <Badge variant="default">
                      {t(`budget.categories.${entry.category as ExpenseCategory}`)}
                    </Badge>
                    <time dateTime={entry.spentAt}>{entry.spentAt}</time>
                  </div>
                  <strong className={styles.recentAmount}>
                    {currency.format(entry.amountKrw)}
                  </strong>
                  {(entry.merchant || entry.note) && (
                    <p className={styles.recentDetail}>
                      {[entry.merchant, entry.note].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleRemove(entry.id)}
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
