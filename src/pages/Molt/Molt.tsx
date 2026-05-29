import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Progress from '@components/common/Progress'
import Select from '@components/common/Select'
import Sparkline from '@components/common/Sparkline'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  MOLT_KINDS,
  averageCycleDays,
  completedIntervalsDays,
  daysBetween,
  medianCycleDays,
  moltFormSchema,
  moltStats,
  predictNext,
  useActivePetMolts,
  useMoltStore,
  type MoltEvent,
  type MoltFormValues,
  type MoltKind,
} from '@features/molt'
import { useOnboardingStore } from '@features/onboarding'
import { useSpecies, useSpeciesList } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Molt.module.css'

type Category = 'reptile' | 'arthropod' | 'bird' | 'amphibian' | 'mammal' | null

const KIND_VARIANT: Record<MoltKind, 'success' | 'warning' | 'error' | 'primary'> = {
  complete: 'success',
  incomplete: 'warning',
  stuck: 'error',
  in_progress: 'primary',
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function Molt() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('molt.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const pets = useOnboardingStore((s) => s.pets)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const activeEvents = useActivePetMolts()
  const allEvents = useMoltStore((s) => s.events)
  const addEvent = useMoltStore((s) => s.addEvent)
  const removeEvent = useMoltStore((s) => s.removeEvent)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)
  const { data: speciesList = [] } = useSpeciesList({})

  const [showAllPets, setShowAllPets] = useState(false)
  const events = showAllPets ? allEvents : activeEvents
  const showPetBadge = showAllPets && pets.length > 1

  const category = profile.category as Category
  // The shed/molt noun adapts to the active pet's category.
  const term = t(`molt.term.${category ?? 'default'}`)
  const isArthropod = category === 'arthropod'

  const today = todayIso()
  const prediction = useMemo(() => predictNext(events, today), [events, today])
  const average = useMemo(() => averageCycleDays(events), [events])
  const median = useMemo(() => medianCycleDays(events), [events])
  const intervals = useMemo(() => completedIntervalsDays(events), [events])
  const stats = useMemo(() => moltStats(events), [events])

  // Progress through the current cycle: days elapsed since the last anchor
  // out of the predicted interval. Clamped so an overdue cycle reads 100%.
  const cycleProgress = useMemo(() => {
    if (!prediction || !stats.lastDate) return null
    const elapsed = daysBetween(stats.lastDate, today)
    return {
      elapsed: Math.max(0, elapsed),
      total: prediction.intervalDays,
    }
  }, [prediction, stats.lastDate, today])

  const sparkPoints = useMemo(() => intervals.map((days, i) => ({ x: i, y: days })), [intervals])

  function petLabel(petId: string | null | undefined): { name: string; emoji: string } | null {
    if (!petId) return null
    const pet = pets.find((p) => p.id === petId)
    if (!pet) return null
    const sp = speciesList.find((s) => s.id === pet.speciesId)
    return {
      name: pet.petName?.trim() || sp?.koreanName || t('petSwitcher.title', { count: 1 }),
      emoji: sp?.heroEmoji ?? '🐾',
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MoltFormValues>({
    resolver: zodResolver(moltFormSchema),
    defaultValues: {
      kind: 'complete',
      occurredAt: todayIso(),
      notes: '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    addEvent({
      speciesId: profile.speciesId,
      occurredAt: values.occurredAt,
      kind: values.kind,
      notes: values.notes.trim(),
    })
    toast(t('molt.saved'), 'success')
    reset({ kind: values.kind, occurredAt: todayIso(), notes: '' })
  })

  const confidenceVariant =
    prediction?.confidence === 'high'
      ? 'success'
      : prediction?.confidence === 'medium'
        ? 'primary'
        : 'warning'

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('molt.title')}</h1>
        <p className={styles.subtitle}>{t('molt.subtitle')}</p>
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
            {t('molt.showAllPets')}
          </label>
        )}
      </header>

      {/* Prediction (primary) */}
      <Card padding="lg" className={styles.predictionCard}>
        <Card.Body>
          <div className={styles.predictionHead}>
            <h2 className={styles.predictionTitle}>{t('molt.prediction.title', { term })}</h2>
            {prediction && (
              <Badge variant={confidenceVariant}>
                {t(`molt.confidence.${prediction.confidence}`)}
              </Badge>
            )}
          </div>

          {prediction ? (
            <>
              <div className={styles.dday}>
                <span
                  className={`${styles.ddayValue} ${prediction.overdue ? styles.ddayOverdue : ''}`}
                >
                  {prediction.overdue
                    ? `D+${Math.abs(prediction.daysUntil)}`
                    : `D-${prediction.daysUntil}`}
                </span>
                <span className={styles.ddayDate}>
                  {t('molt.prediction.expected', { date: prediction.predictedDate })}
                </span>
              </div>

              {cycleProgress && (
                <div className={styles.progressWrap}>
                  <Progress
                    value={cycleProgress.elapsed}
                    max={cycleProgress.total}
                    variant={prediction.overdue ? 'warning' : 'primary'}
                    label={t('molt.prediction.dayOfCycle', {
                      elapsed: cycleProgress.elapsed,
                      total: cycleProgress.total,
                    })}
                  />
                  <div className={styles.progressLabels}>
                    <span>{stats.lastDate}</span>
                    <span>{prediction.predictedDate}</span>
                  </div>
                </div>
              )}

              <dl className={styles.metrics}>
                <div>
                  <dt>{t('molt.metrics.average')}</dt>
                  <dd>{t('molt.metrics.days', { count: average ?? 0 })}</dd>
                </div>
                <div>
                  <dt>{t('molt.metrics.median')}</dt>
                  <dd>{t('molt.metrics.days', { count: median ?? 0 })}</dd>
                </div>
                <div>
                  <dt>{t('molt.metrics.samples')}</dt>
                  <dd>{intervals.length}</dd>
                </div>
              </dl>

              {prediction.overdue && (
                <div className={styles.alertRow}>
                  <Alert variant="warning" title={t('molt.overdue.title', { term })}>
                    {isArthropod ? t('molt.overdue.arthropod') : t('molt.overdue.generic')}
                  </Alert>
                </div>
              )}
            </>
          ) : (
            <p className={styles.hint}>{t('molt.prediction.needMore', { term })}</p>
          )}
        </Card.Body>
      </Card>

      {/* Arthropod-specific guidance */}
      {isArthropod && (
        <Card padding="md" className={styles.tipCard}>
          <Card.Body>
            <h2 className={styles.tipTitle}>{t('molt.tip.arthropodTitle')}</h2>
            <p className={styles.tipText}>{t('molt.tip.arthropodBody')}</p>
          </Card.Body>
        </Card>
      )}

      {/* Log form */}
      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.sectionTitle}>{t('molt.form.title', { term })}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.formRow}>
              <Input
                type="date"
                label={t('molt.form.date')}
                error={errors.occurredAt?.message ? t(errors.occurredAt.message) : undefined}
                {...register('occurredAt')}
              />
              <Select
                label={t('molt.form.kind')}
                options={MOLT_KINDS.map((k) => ({ value: k, label: t(`molt.kinds.${k}`) }))}
                {...register('kind')}
              />
            </div>
            <Textarea
              label={t('molt.form.notes')}
              rows={3}
              placeholder={t('molt.form.notesPlaceholder')}
              error={errors.notes?.message ? t(errors.notes.message) : undefined}
              {...register('notes')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('molt.form.submit')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {/* Interval trend */}
      {sparkPoints.length >= 3 && (
        <Card padding="lg">
          <Card.Body>
            <div className={styles.trendHead}>
              <h2 className={styles.sectionTitle}>{t('molt.trend.title')}</h2>
              <span className={styles.trendMeta}>
                {t('molt.trend.meta', { count: intervals.length })}
              </span>
            </div>
            <Sparkline
              points={sparkPoints}
              ariaLabel={t('molt.trend.chartLabel')}
              formatValue={(v) => t('molt.metrics.days', { count: v })}
            />
          </Card.Body>
        </Card>
      )}

      {/* History timeline */}
      {events.length === 0 ? (
        <EmptyState
          icon="🪺"
          title={t('molt.empty.title', { term })}
          description={t('molt.empty.desc')}
        />
      ) : (
        <ul className={styles.timeline}>
          {events.map((entry, index) => {
            // events are sorted desc; the next-older event is the previous cycle.
            const older = events[index + 1] as MoltEvent | undefined
            const gap =
              older && entry.kind !== 'in_progress' && older.kind !== 'in_progress'
                ? daysBetween(older.occurredAt, entry.occurredAt)
                : null
            const label = petLabel(entry.petId)
            const showBadge = label && (showPetBadge || entry.petId !== activePetId)
            return (
              <li key={entry.id} className={styles.timelineItem}>
                <Card padding="md">
                  <Card.Body>
                    <div className={styles.entryHeader}>
                      <div className={styles.entryHeaderLeft}>
                        <Badge variant={KIND_VARIANT[entry.kind]}>
                          {t(`molt.kinds.${entry.kind}`)}
                        </Badge>
                        <span className={styles.entryDate}>{entry.occurredAt}</span>
                        {gap !== null && (
                          <span className={styles.gapNote}>
                            {t('molt.history.sincePrev', { count: gap })}
                          </span>
                        )}
                        {showBadge && label && (
                          <Badge variant="default">
                            <span aria-hidden="true">{label.emoji}</span> {label.name}
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeEvent(entry.id)}
                      >
                        {t('molt.history.remove')}
                      </button>
                    </div>
                    {entry.notes && <p className={styles.entryNotes}>{entry.notes}</p>}
                    {!entry.speciesId && (
                      <p className={styles.entryFooter}>{t('molt.history.speciesUnknown')}</p>
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

export default Molt
