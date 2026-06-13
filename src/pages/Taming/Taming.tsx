import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Sparkline from '@components/common/Sparkline'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpecies, useSpeciesList } from '@domains/species'
import {
  CALMNESS_LEVELS,
  STRESS_SIGNS,
  avgCalmness,
  calmnessTrend,
  handlingFormSchema,
  handlingGuidanceCode,
  latestSession,
  progressDelta,
  useActivePetSessions,
  useTamingStore,
  type HandlingFormValues,
  type StressSign,
} from '@domains/taming'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Taming.module.css'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const DELTA_THRESHOLD = 0.5

function Taming() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('taming.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const pets = useOnboardingStore((s) => s.pets)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const activeSessions = useActivePetSessions()
  const allSessions = useTamingStore((s) => s.sessions)
  const addSession = useTamingStore((s) => s.addSession)
  const removeSession = useTamingStore((s) => s.removeSession)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)
  const { data: speciesList = [] } = useSpeciesList({})

  const [showAllPets, setShowAllPets] = useState(false)
  const sessions = showAllPets ? allSessions : activeSessions
  const showPetBadge = showAllPets && pets.length > 1

  const tolerance = species?.handlingTolerance ?? null

  const average = useMemo(() => avgCalmness(sessions), [sessions])
  const trend = useMemo(() => calmnessTrend(sessions), [sessions])
  const delta = useMemo(() => progressDelta(sessions), [sessions])
  const latest = useMemo(() => latestSession(sessions), [sessions])
  const guidance = useMemo(() => handlingGuidanceCode(tolerance, sessions), [tolerance, sessions])

  const sparkPoints = useMemo(() => trend.map((y, x) => ({ x, y })), [trend])

  // delta -> 개선 / 정체 / 악화 badge.
  const deltaState =
    delta === null
      ? null
      : delta >= DELTA_THRESHOLD
        ? 'improving'
        : delta <= -DELTA_THRESHOLD
          ? 'declining'
          : 'steady'
  const deltaVariant =
    deltaState === 'improving' ? 'success' : deltaState === 'declining' ? 'error' : 'default'

  function petLabel(petId: string | null | undefined): { name: string; emoji: string } | null {
    if (!petId) return null
    const pet = pets.find((p) => p.id === petId)
    if (!pet) return null
    const sp = speciesList.find((item) => item.id === pet.speciesId)
    return {
      name: pet.petName?.trim() || sp?.koreanName || t('petSwitcher.title', { count: 1 }),
      emoji: sp?.heroEmoji ?? '🐾',
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<HandlingFormValues>({
    resolver: zodResolver(handlingFormSchema),
    defaultValues: {
      sessionAt: todayIso(),
      durationMin: 5,
      calmness: 3,
      stressSigns: [],
      note: '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    addSession({
      speciesId: profile.speciesId,
      sessionAt: values.sessionAt,
      durationMin: values.durationMin,
      calmness: values.calmness,
      stressSigns: values.stressSigns,
      note: values.note.trim(),
    })
    toast(t('taming.saved'), 'success')
    reset({
      sessionAt: todayIso(),
      durationMin: values.durationMin,
      calmness: 3,
      stressSigns: [],
      note: '',
    })
  })

  // The tolerance guidance card variant: low tolerance is a prominent warning,
  // medium/high are gentler reminders.
  const toleranceVariant = tolerance === 'low' ? 'warning' : 'info'

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('taming.title')}</h1>
        <p className={styles.subtitle}>{t('taming.subtitle')}</p>
        {species && (
          <span className={styles.speciesNote}>
            <span aria-hidden="true">{species.heroEmoji}</span> {species.koreanName}
          </span>
        )}
        {pets.length > 1 && (
          <label className={styles.showAllToggle}>
            <input
              type="checkbox"
              checked={showAllPets}
              onChange={(e) => setShowAllPets(e.target.checked)}
            />
            {t('taming.showAllPets')}
          </label>
        )}
      </header>

      {/* Tolerance guidance (welfare context for the active species) */}
      {tolerance && (
        <Alert
          variant={toleranceVariant}
          title={t(`taming.tolerance.${tolerance}.title`)}
          className={styles.toleranceAlert}
        >
          {t(`taming.tolerance.${tolerance}.body`)}
        </Alert>
      )}

      {/* Log form */}
      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.sectionTitle}>{t('taming.form.title')}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.formRow}>
              <Input
                type="date"
                label={t('taming.form.date')}
                error={errors.sessionAt?.message ? t(errors.sessionAt.message) : undefined}
                {...register('sessionAt')}
              />
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={600}
                label={t('taming.form.duration')}
                helperText={t('taming.form.durationHelp')}
                error={errors.durationMin?.message ? t(errors.durationMin.message) : undefined}
                {...register('durationMin', { valueAsNumber: true })}
              />
            </div>

            {/* Calmness 1..5 segmented control */}
            <Controller
              control={control}
              name="calmness"
              render={({ field }) => (
                <fieldset className={styles.fieldset}>
                  <legend className={styles.legend}>{t('taming.form.calmness')}</legend>
                  <div
                    className={styles.segments}
                    role="radiogroup"
                    aria-label={t('taming.form.calmness')}
                  >
                    {CALMNESS_LEVELS.map((level) => {
                      const active = field.value === level
                      return (
                        <button
                          key={level}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          className={`${styles.segment} ${active ? styles.segmentActive : ''}`}
                          onClick={() => field.onChange(level)}
                        >
                          <span className={styles.segmentValue}>{level}</span>
                          <span className={styles.segmentLabel}>
                            {t(`taming.calmnessScale.${level}`)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {errors.calmness?.message && (
                    <p className={styles.fieldError}>{t(errors.calmness.message)}</p>
                  )}
                </fieldset>
              )}
            />

            {/* Stress signs multi-select chips */}
            <Controller
              control={control}
              name="stressSigns"
              render={({ field }) => {
                const selected = field.value
                const toggle = (sign: StressSign) => {
                  field.onChange(
                    selected.includes(sign)
                      ? selected.filter((s) => s !== sign)
                      : [...selected, sign],
                  )
                }
                return (
                  <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>{t('taming.form.stressSigns')}</legend>
                    <p className={styles.fieldHint}>{t('taming.form.stressSignsHelp')}</p>
                    <div className={styles.chips}>
                      {STRESS_SIGNS.map((sign) => {
                        const active = selected.includes(sign)
                        return (
                          <button
                            key={sign}
                            type="button"
                            aria-pressed={active}
                            className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                            onClick={() => toggle(sign)}
                          >
                            {t(`taming.signs.${sign}`)}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                )
              }}
            />

            <Textarea
              label={t('taming.form.note')}
              rows={3}
              placeholder={t('taming.form.notePlaceholder')}
              error={errors.note?.message ? t(errors.note.message) : undefined}
              {...register('note')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('taming.form.submit')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {/* Progress summary */}
      {sessions.length > 0 && (
        <Card padding="lg" className={styles.progressCard}>
          <Card.Body>
            <div className={styles.progressHead}>
              <h2 className={styles.sectionTitle}>{t('taming.progress.title')}</h2>
              {deltaState && (
                <Badge variant={deltaVariant}>{t(`taming.progress.delta.${deltaState}`)}</Badge>
              )}
            </div>

            <dl className={styles.metrics}>
              <div>
                <dt>{t('taming.progress.avgCalmness')}</dt>
                <dd>
                  {average === null ? '—' : t('taming.progress.outOfFive', { value: average })}
                </dd>
              </div>
              <div>
                <dt>{t('taming.progress.sessions')}</dt>
                <dd>{sessions.length}</dd>
              </div>
              <div>
                <dt>{t('taming.progress.lastSession')}</dt>
                <dd>{latest ? latest.sessionAt : '—'}</dd>
              </div>
            </dl>

            {sparkPoints.length >= 2 && (
              <div className={styles.trendWrap}>
                <span className={styles.trendLabel}>{t('taming.progress.trendLabel')}</span>
                <Sparkline
                  points={sparkPoints}
                  ariaLabel={t('taming.progress.chartLabel')}
                  formatValue={(v) => t('taming.progress.outOfFive', { value: v })}
                />
              </div>
            )}

            <div className={styles.recommendation}>
              <Alert
                variant={guidance === 'highStress' ? 'warning' : 'info'}
                title={t('taming.recommendation.title')}
              >
                {t(`taming.guidance.${guidance}`)}
              </Alert>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* History */}
      {sessions.length === 0 ? (
        <EmptyState
          icon="🤲"
          title={t('taming.empty.title')}
          description={t('taming.empty.desc')}
        />
      ) : (
        <ul className={styles.historyList}>
          {sessions.map((entry) => {
            const label = petLabel(entry.petId)
            const showBadge = label && (showPetBadge || entry.petId !== activePetId)
            return (
              <li key={entry.id}>
                <Card padding="md">
                  <Card.Body>
                    <div className={styles.entryHeader}>
                      <div className={styles.entryHeaderLeft}>
                        <span className={styles.entryDate}>{entry.sessionAt}</span>
                        <Badge variant="primary">
                          {t('taming.history.calmness', { value: entry.calmness })}
                        </Badge>
                        <span className={styles.entryMeta}>
                          {t('taming.history.duration', { count: entry.durationMin })}
                        </span>
                        {showBadge && label && (
                          <Badge variant="default">
                            <span aria-hidden="true">{label.emoji}</span> {label.name}
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeSession(entry.id)}
                      >
                        {t('taming.history.remove')}
                      </button>
                    </div>

                    {entry.stressSigns.length > 0 && (
                      <div className={styles.signChips}>
                        {entry.stressSigns.map((sign) => (
                          <span key={sign} className={styles.signChip}>
                            {t(`taming.signs.${sign}`)}
                          </span>
                        ))}
                      </div>
                    )}

                    {entry.note && <p className={styles.entryNote}>{entry.note}</p>}
                    {!entry.speciesId && (
                      <p className={styles.entryFooter}>{t('taming.history.speciesUnknown')}</p>
                    )}
                  </Card.Body>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default Taming
