import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import PetBadge, { ShowAllPetsToggle } from '@components/common/PetBadge'
import Select from '@components/common/Select'
import Sparkline, { type SparklinePoint } from '@components/common/Sparkline'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  upcomingDues,
  useActivePetHealth,
  useHealthStore,
  VACCINATION_KINDS,
  vaccinationFormSchema,
  weightFormSchema,
  weightTrend,
  type VaccinationFormValues,
  type WeightFormValues,
} from '@domains/health'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpecies } from '@domains/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Health.module.css'

function todayIso(): string {
  const now = new Date()
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return localTime.toISOString().slice(0, 10)
}

function dateOrdinal(value: string): number {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

type PendingHealthDelete = { kind: 'weight' | 'vaccination'; id: string } | null

function Health() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('health.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)

  const active = useActivePetHealth()
  const allWeights = useHealthStore((s) => s.weights)
  const allVaccinations = useHealthStore((s) => s.vaccinations)
  const [showAllPets, setShowAllPets] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PendingHealthDelete>(null)
  const weights = showAllPets ? allWeights : active.weights
  const vaccinations = showAllPets ? allVaccinations : active.vaccinations
  const addWeight = useHealthStore((s) => s.addWeight)
  const removeWeight = useHealthStore((s) => s.removeWeight)
  const addVaccination = useHealthStore((s) => s.addVaccination)
  const removeVaccination = useHealthStore((s) => s.removeVaccination)

  const trend = useMemo(() => weightTrend(active.weights), [active.weights])
  const upcoming = useMemo(() => upcomingDues(vaccinations), [vaccinations])
  const points: SparklinePoint[] = useMemo(
    () =>
      [...active.weights]
        .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
        .map((w) => ({ x: dateOrdinal(w.measuredAt), y: w.grams })),
    [active.weights]
  )

  const weightForm = useForm<WeightFormValues>({
    resolver: zodResolver(weightFormSchema),
    defaultValues: { measuredAt: todayIso(), grams: 0, note: '' },
  })

  const onSubmitWeight = weightForm.handleSubmit((values) => {
    addWeight({ measuredAt: values.measuredAt, grams: values.grams, note: values.note })
    toast(t('health.addWeight'), 'success')
    weightForm.reset({ measuredAt: todayIso(), grams: 0, note: '' })
  })

  const vForm = useForm<VaccinationFormValues>({
    resolver: zodResolver(vaccinationFormSchema),
    defaultValues: {
      kind: 'vaccine',
      name: '',
      administeredAt: todayIso(),
      nextDueAt: '',
      clinic: '',
      note: '',
    },
  })
  const administeredAt = useWatch({ control: vForm.control, name: 'administeredAt' })

  const onSubmitVaccination = vForm.handleSubmit((values) => {
    addVaccination({
      kind: values.kind,
      name: values.name,
      administeredAt: values.administeredAt,
      nextDueAt: values.nextDueAt || null,
      clinic: values.clinic,
      note: values.note,
    })
    toast(t('health.addVaccination'), 'success')
    vForm.reset({
      kind: values.kind,
      name: '',
      administeredAt: todayIso(),
      nextDueAt: '',
      clinic: '',
      note: '',
    })
  })

  function confirmDelete() {
    if (!pendingDelete) return
    if (pendingDelete.kind === 'weight') removeWeight(pendingDelete.id)
    else removeVaccination(pendingDelete.id)
    setPendingDelete(null)
    toast(t('common.delete'), 'success')
  }

  return (
    <section className={styles.page}>
      <header className={styles.heroHeader}>
        <h1>{t('health.title')}</h1>
        <p className={styles.subtitle}>{t('health.subtitle')}</p>
        {species && (
          <p className={styles.speciesLine}>
            {species.heroEmoji} {species.koreanName}
          </p>
        )}
        <ShowAllPetsToggle checked={showAllPets} onChange={setShowAllPets} />
        <div className={styles.headerActions}>
          <Link to="/calendar" className={styles.headerLink}>
            {t('nav.calendar')} →
          </Link>
          <Link to="/hospitals" className={styles.headerLink}>
            {t('nav.hospitals')} →
          </Link>
        </div>
      </header>

      <section aria-labelledby="upcoming-heading" className={styles.section}>
        <h2 id="upcoming-heading" className={styles.sectionTitle}>
          {t('health.upcomingTitle')}
        </h2>
        {upcoming.length === 0 ? (
          <p className={styles.empty}>{t('health.upcomingEmpty')}</p>
        ) : (
          <ul className={styles.upcomingList}>
            {upcoming.map(({ vaccination, daysLeft }) => (
              <li key={vaccination.id} className={styles.upcomingItem}>
                <Badge variant={daysLeft < 0 ? 'error' : daysLeft <= 7 ? 'warning' : 'primary'}>
                  {daysLeft < 0
                    ? t('health.overdue', { count: -daysLeft })
                    : t('health.daysLeft', { count: daysLeft })}
                </Badge>
                <div>
                  <strong>{vaccination.name}</strong>
                  <p className={styles.upcomingMeta}>
                    {t(`health.kinds.${vaccination.kind}`)} · {vaccination.nextDueAt}
                  </p>
                  <PetBadge petId={vaccination.petId} hideWhenActive={!showAllPets} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="weight-heading" className={styles.section}>
        <h2 id="weight-heading" className={styles.sectionTitle}>
          {t('health.weightTitle')}
        </h2>
        <div className={styles.weightLayout}>
          <Card padding="lg" className={styles.chartCard}>
            <Card.Body>
              {points.length === 0 ? (
                <EmptyState icon="⚖️" title={t('health.weightEmpty')} />
              ) : (
                <>
                  <Sparkline
                    points={points}
                    ariaLabel={t('health.weightChartLabel')}
                    formatValue={(v) => `${v}g`}
                  />
                  <dl className={styles.statsRow}>
                    <div>
                      <dt>{t('health.weightLatest')}</dt>
                      <dd>{trend.latest}g</dd>
                    </div>
                    <div>
                      <dt>{t('health.weightDelta30')}</dt>
                      <dd>
                        {trend.delta30dGrams === null
                          ? '—'
                          : `${trend.delta30dGrams > 0 ? '+' : ''}${trend.delta30dGrams}g`}
                      </dd>
                    </div>
                    <div>
                      <dt>{t('health.weightRange')}</dt>
                      <dd>
                        {trend.min}g / {trend.max}g
                      </dd>
                    </div>
                    <div>
                      <dt>{t('health.weightCount')}</dt>
                      <dd>{trend.count}</dd>
                    </div>
                  </dl>
                </>
              )}
            </Card.Body>
          </Card>

          <Card padding="lg" className={styles.formCard}>
            <Card.Body>
              <h3 className={styles.formTitle}>{t('health.addWeightTitle')}</h3>
              <form onSubmit={onSubmitWeight} className={styles.form} noValidate>
                <Input
                  type="date"
                  max={todayIso()}
                  label={t('health.weightDate')}
                  error={
                    weightForm.formState.errors.measuredAt?.message
                      ? t(weightForm.formState.errors.measuredAt.message)
                      : undefined
                  }
                  {...weightForm.register('measuredAt')}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  label={t('health.weightGrams')}
                  error={
                    weightForm.formState.errors.grams?.message
                      ? t(weightForm.formState.errors.grams.message)
                      : undefined
                  }
                  {...weightForm.register('grams', {
                    setValueAs: (v: unknown) => {
                      if (v === '' || v === null || v === undefined) return 0
                      const n = Number(v)
                      return Number.isFinite(n) ? n : 0
                    },
                  })}
                />
                <Textarea
                  rows={2}
                  maxLength={200}
                  label={t('health.weightNote')}
                  {...weightForm.register('note')}
                />
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={weightForm.formState.isSubmitting}
                >
                  {t('health.addWeight')}
                </Button>
              </form>
            </Card.Body>
          </Card>
        </div>

        {weights.length > 0 && (
          <ul className={styles.weightList}>
            {[...weights]
              .reverse()
              .slice(0, 5)
              .map((w) => (
                <li key={w.id} className={styles.weightItem}>
                  <span className={styles.weightDate}>{w.measuredAt}</span>
                  <strong>{w.grams}g</strong>
                  <span className={styles.weightNote}>{w.note ?? ''}</span>
                  <PetBadge petId={w.petId} hideWhenActive={!showAllPets} />
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => setPendingDelete({ kind: 'weight', id: w.id })}
                    aria-expanded={pendingDelete?.kind === 'weight' && pendingDelete.id === w.id}
                    aria-controls={`delete-weight-${w.id}`}
                  >
                    {t('health.remove')}
                  </button>
                  {pendingDelete?.kind === 'weight' && pendingDelete.id === w.id && (
                    <div
                      id={`delete-weight-${w.id}`}
                      className={styles.deleteConfirm}
                      role="group"
                      aria-label={t('health.remove')}
                    >
                      <span>{t('health.remove')}?</span>
                      <button
                        type="button"
                        className={styles.confirmDelete}
                        onClick={confirmDelete}
                      >
                        {t('common.delete')}
                      </button>
                      <button
                        type="button"
                        className={styles.cancelDelete}
                        onClick={() => setPendingDelete(null)}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="v-heading" className={styles.section}>
        <h2 id="v-heading" className={styles.sectionTitle}>
          {t('health.vaccinationTitle')}
        </h2>
        <Card padding="lg" className={styles.formCard}>
          <Card.Body>
            <h3 className={styles.formTitle}>{t('health.addVaccinationTitle')}</h3>
            <form onSubmit={onSubmitVaccination} className={styles.formGrid} noValidate>
              <Select
                label={t('health.vKind')}
                options={VACCINATION_KINDS.map((k) => ({
                  value: k,
                  label: t(`health.kinds.${k}`),
                }))}
                {...vForm.register('kind')}
              />
              <Input
                label={t('health.vName')}
                placeholder={t('health.vNamePlaceholder')}
                maxLength={80}
                error={
                  vForm.formState.errors.name?.message
                    ? t(vForm.formState.errors.name.message)
                    : undefined
                }
                {...vForm.register('name')}
              />
              <Input
                type="date"
                max={todayIso()}
                label={t('health.vDate')}
                error={
                  vForm.formState.errors.administeredAt?.message
                    ? t(vForm.formState.errors.administeredAt.message)
                    : undefined
                }
                {...vForm.register('administeredAt')}
              />
              <Input
                type="date"
                min={administeredAt || undefined}
                label={t('health.vNextDue')}
                {...vForm.register('nextDueAt')}
              />
              <Input label={t('health.vClinic')} maxLength={80} {...vForm.register('clinic')} />
              <Input label={t('health.vNote')} maxLength={200} {...vForm.register('note')} />
              <div className={styles.formGridSubmit}>
                <Button type="submit" variant="primary" isLoading={vForm.formState.isSubmitting}>
                  {t('health.addVaccination')}
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>

        {vaccinations.length === 0 ? (
          <EmptyState icon="💉" title={t('health.vaccinationEmpty')} />
        ) : (
          <ul className={styles.vList}>
            {vaccinations.map((v) => (
              <li key={v.id} className={styles.vItem}>
                <Badge variant="primary">{t(`health.kinds.${v.kind}`)}</Badge>
                <div>
                  <strong>{v.name}</strong>
                  <p className={styles.vMeta}>
                    {v.administeredAt}
                    {v.clinic && ` · ${v.clinic}`}
                    {v.nextDueAt && ` · ${t('health.vNextDue')}: ${v.nextDueAt}`}
                  </p>
                  {v.note && <p className={styles.vNote}>{v.note}</p>}
                  <PetBadge petId={v.petId} hideWhenActive={!showAllPets} />
                </div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => setPendingDelete({ kind: 'vaccination', id: v.id })}
                  aria-expanded={pendingDelete?.kind === 'vaccination' && pendingDelete.id === v.id}
                  aria-controls={`delete-vaccination-${v.id}`}
                >
                  {t('health.remove')}
                </button>
                {pendingDelete?.kind === 'vaccination' && pendingDelete.id === v.id && (
                  <div
                    id={`delete-vaccination-${v.id}`}
                    className={styles.deleteConfirm}
                    role="group"
                    aria-label={t('health.remove')}
                  >
                    <span>{t('health.remove')}?</span>
                    <button type="button" className={styles.confirmDelete} onClick={confirmDelete}>
                      {t('common.delete')}
                    </button>
                    <button
                      type="button"
                      className={styles.cancelDelete}
                      onClick={() => setPendingDelete(null)}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}

export default Health
