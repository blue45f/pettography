import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Sparkline, { type SparklinePoint } from '@components/common/Sparkline'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  AGE_STAGES,
  daysBetween,
  feedFormSchema,
  feedingRule,
  feedingStats,
  nextFeedingDate,
  recommendFrequencyDays,
  recommendPreyForSnake,
  refusalStreak,
  useActivePetFeedings,
  useFeedingStore,
  usesBodyWeightSizing,
  type AgeStage,
  type FeedFormValues,
} from '@features/feeding'
import { useOnboardingStore } from '@features/onboarding'
import { useSpeciesList } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { buildCsv } from '@utils/csv'
import { downloadTextFile } from '@utils/download'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Feeding.module.css'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function Feeding() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('feeding.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const pets = useOnboardingStore((s) => s.pets)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const activeLogs = useActivePetFeedings()
  const allLogs = useFeedingStore((s) => s.logs)
  const addLog = useFeedingStore((s) => s.addLog)
  const removeLog = useFeedingStore((s) => s.removeLog)
  const { data: speciesList = [] } = useSpeciesList({})

  const [showAllPets, setShowAllPets] = useState(false)
  const [ageStage, setAgeStage] = useState<AgeStage>('adult')
  const [bodyWeight, setBodyWeight] = useState('')

  const logs = showAllPets ? allLogs : activeLogs
  const showPetBadge = showAllPets && pets.length > 1

  const activeSpecies = useMemo(
    () => speciesList.find((s) => s.id === profile.speciesId) ?? null,
    [speciesList, profile.speciesId]
  )
  const rule = useMemo(
    () => feedingRule(activeSpecies?.slug, activeSpecies?.category ?? profile.category),
    [activeSpecies, profile.category]
  )
  const freqDays = rule ? recommendFrequencyDays(rule, ageStage) : null
  const snakeSizing = usesBodyWeightSizing(rule)

  const preyRange = useMemo(() => {
    if (!snakeSizing) return null
    const grams = Number(bodyWeight)
    if (!bodyWeight.trim() || !Number.isFinite(grams) || grams <= 0) return null
    return recommendPreyForSnake(grams)
  }, [snakeSizing, bodyWeight])

  const stats = useMemo(() => feedingStats(logs), [logs])
  const streak = useMemo(() => refusalStreak(logs), [logs])

  const nextDate = stats.lastFed && freqDays ? nextFeedingDate(stats.lastFed, freqDays) : null
  const daysUntil = nextDate ? daysBetween(todayIso(), nextDate) : null
  const overdue = daysUntil !== null && daysUntil < 0

  // Sparkline of gaps (days) between consecutive feedings, oldest -> newest.
  const sparkPoints = useMemo<SparklinePoint[]>(() => {
    const asc = [...logs].sort((a, b) => a.fedAt.localeCompare(b.fedAt))
    const points: SparklinePoint[] = []
    for (let i = 1; i < asc.length; i += 1) {
      points.push({ x: i - 1, y: daysBetween(asc[i - 1].fedAt, asc[i].fedAt), label: asc[i].fedAt })
    }
    return points
  }, [logs])

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
  } = useForm<FeedFormValues>({
    resolver: zodResolver(feedFormSchema),
    defaultValues: {
      fedAt: todayIso(),
      item: '',
      quantity: null,
      accepted: true,
      notes: '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    addLog({
      speciesId: profile.speciesId,
      fedAt: values.fedAt,
      item: values.item,
      quantity: values.quantity ?? null,
      accepted: values.accepted,
      notes: values.notes,
    })
    toast(t('feeding.toastSaved'), 'success')
    reset({
      fedAt: todayIso(),
      item: '',
      quantity: null,
      accepted: true,
      notes: '',
    })
  })

  function exportCsv() {
    const rows = [...logs]
      .sort((a, b) => a.fedAt.localeCompare(b.fedAt))
      .map((l) => [l.fedAt, l.item, l.quantity ?? '', l.accepted, l.notes])
    downloadTextFile(
      'pettography-feeding.csv',
      buildCsv(['date', 'item', 'quantity', 'accepted', 'notes'], rows),
      'text/csv;charset=utf-8'
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('feeding.title')}</h1>
        <p className={styles.subtitle}>{t('feeding.subtitle')}</p>
        {activeSpecies && (
          <p className={styles.speciesNote}>
            {activeSpecies.heroEmoji} {activeSpecies.koreanName}
          </p>
        )}
        {pets.length > 1 && (
          <label className={styles.showAllToggle}>
            <input
              type="checkbox"
              checked={showAllPets}
              onChange={(e) => setShowAllPets(e.target.checked)}
            />
            {t('feeding.showAllPets')}
          </label>
        )}
        {logs.length > 0 && (
          <Button variant="secondary" onClick={exportCsv} className={styles.exportButton}>
            {t('common.exportCsv')}
          </Button>
        )}
      </header>

      {/* Prey calculator (primary) */}
      <Card padding="lg" className={styles.calcCard}>
        <Card.Body>
          <h2 className={styles.sectionTitle}>{t('feeding.calc.title')}</h2>
          {rule ? (
            <>
              <div className={styles.stageToggle} role="group" aria-label={t('feeding.calc.stage')}>
                {AGE_STAGES.map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    className={ageStage === stage ? styles.stageActive : styles.stageButton}
                    aria-pressed={ageStage === stage}
                    onClick={() => setAgeStage(stage)}
                  >
                    {t(`feeding.stages.${stage}`)}
                  </button>
                ))}
              </div>

              {snakeSizing && (
                <div className={styles.weightRow}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="0"
                    label={t('feeding.calc.bodyWeight')}
                    helperText={t('feeding.calc.bodyWeightHelper')}
                    value={bodyWeight}
                    onChange={(e) => setBodyWeight(e.target.value)}
                  />
                </div>
              )}

              <dl className={styles.calcGrid}>
                {snakeSizing && (
                  <div className={styles.calcItem}>
                    <dt>{t('feeding.calc.preyWeight')}</dt>
                    <dd>
                      {preyRange ? (
                        <strong>
                          {t('feeding.calc.preyWeightRange', {
                            min: preyRange.minPreyG,
                            max: preyRange.maxPreyG,
                          })}
                        </strong>
                      ) : (
                        <span className={styles.muted}>{t('feeding.calc.preyWeightHint')}</span>
                      )}
                    </dd>
                  </div>
                )}
                <div className={styles.calcItem}>
                  <dt>{t('feeding.calc.preySize')}</dt>
                  <dd>{t(`feeding.preyRules.${rule.preySizeRuleCode}`)}</dd>
                </div>
                <div className={styles.calcItem}>
                  <dt>{t('feeding.calc.frequency')}</dt>
                  <dd>
                    <strong>{t('feeding.calc.everyNDays', { count: freqDays ?? 0 })}</strong>
                  </dd>
                </div>
              </dl>

              <p className={styles.ruleNote}>{t(rule.note)}</p>
              <p className={styles.disclaimer}>{t('feeding.disclaimer')}</p>
            </>
          ) : (
            <p className={styles.muted}>{t('feeding.calc.noSpecies')}</p>
          )}
        </Card.Body>
      </Card>

      {/* Next feeding */}
      <Card padding="lg" className={styles.nextCard}>
        <Card.Body>
          <h2 className={styles.sectionTitle}>{t('feeding.next.title')}</h2>
          {nextDate && daysUntil !== null ? (
            <div className={styles.nextRow}>
              <div className={styles.nextDate}>
                <span className={styles.nextDateValue}>{nextDate}</span>
                <Badge variant={overdue ? 'warning' : 'primary'}>
                  {overdue
                    ? t('feeding.next.overdue', { count: Math.abs(daysUntil) })
                    : daysUntil === 0
                      ? t('feeding.next.today')
                      : t('feeding.next.dday', { count: daysUntil })}
                </Badge>
              </div>
              <p className={styles.nextMeta}>
                {t('feeding.next.basis', {
                  date: stats.lastFed,
                  count: freqDays ?? 0,
                })}
              </p>
            </div>
          ) : (
            <p className={styles.muted}>{t('feeding.next.empty')}</p>
          )}

          {streak >= 2 && (
            <div className={styles.warn} role="alert">
              <p className={styles.warnTitle}>{t('feeding.refusal.warning', { count: streak })}</p>
              {activeSpecies?.category === 'arthropod' && (
                <p className={styles.warnNote}>{t('feeding.refusal.arthropodNote')}</p>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* New feeding log */}
      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.sectionTitle}>{t('feeding.log.title')}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.formRow}>
              <Input
                type="date"
                label={t('feeding.log.fedAt')}
                error={errors.fedAt?.message ? t(errors.fedAt.message) : undefined}
                {...register('fedAt')}
              />
              <Input
                type="text"
                label={t('feeding.log.item')}
                placeholder={t('feeding.log.itemPlaceholder')}
                error={errors.item?.message ? t(errors.item.message) : undefined}
                {...register('item')}
              />
            </div>
            <div className={styles.formRow}>
              <Input
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                label={t('feeding.log.quantity')}
                helperText={t('feeding.log.quantityHelper')}
                error={errors.quantity?.message ? t(errors.quantity.message) : undefined}
                {...register('quantity', {
                  setValueAs: (v: unknown) => {
                    if (v === '' || v === null || v === undefined) return null
                    const num = Number(v)
                    return Number.isFinite(num) ? num : null
                  },
                })}
              />
              <label className={styles.acceptedToggle}>
                <input type="checkbox" {...register('accepted')} />
                <span>{t('feeding.log.accepted')}</span>
              </label>
            </div>
            <Textarea
              label={t('feeding.log.notes')}
              rows={3}
              error={errors.notes?.message ? t(errors.notes.message) : undefined}
              {...register('notes')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('feeding.log.submit')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {/* Feeding-gap trend */}
      {sparkPoints.length >= 3 && (
        <Card padding="lg">
          <Card.Body>
            <h2 className={styles.sectionTitle}>{t('feeding.trend.title')}</h2>
            <Sparkline
              points={sparkPoints}
              ariaLabel={t('feeding.trend.chartLabel')}
              formatValue={(v) => t('feeding.calc.everyNDays', { count: v })}
            />
            <p className={styles.trendMeta}>{t('feeding.trend.meta')}</p>
          </Card.Body>
        </Card>
      )}

      {/* History */}
      {logs.length === 0 ? (
        <EmptyState
          variant="log"
          icon="🍽️"
          title={t('feeding.empty.title')}
          description={t('feeding.empty.desc')}
          hint={t('feeding.empty.hint')}
        />
      ) : (
        <ul className={styles.list}>
          {[...logs]
            .sort((a, b) => b.fedAt.localeCompare(a.fedAt))
            .map((log) => {
              const label = petLabel(log.petId)
              const showBadge = label && (showPetBadge || log.petId !== activePetId)
              return (
                <li key={log.id}>
                  <Card padding="md">
                    <Card.Body>
                      <div className={styles.entryHeader}>
                        <div className={styles.entryHeaderLeft}>
                          <Badge variant={log.accepted ? 'success' : 'warning'}>
                            {log.accepted ? t('feeding.log.ate') : t('feeding.log.refused')}
                          </Badge>
                          <span className={styles.entryDate}>{log.fedAt}</span>
                          {showBadge && label && (
                            <Badge variant="default">
                              <span aria-hidden="true">{label.emoji}</span> {label.name}
                            </Badge>
                          )}
                        </div>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => removeLog(log.id)}
                        >
                          {t('feeding.log.remove')}
                        </button>
                      </div>
                      <p className={styles.entryItem}>
                        {log.item}
                        {log.quantity !== null && (
                          <span className={styles.entryQuantity}>
                            {' '}
                            {t('feeding.log.quantityCount', { count: log.quantity })}
                          </span>
                        )}
                      </p>
                      {log.notes && <p className={styles.entryNotes}>{log.notes}</p>}
                      {!log.speciesId && (
                        <p className={styles.entryFooter}>{t('feeding.log.speciesUnknown')}</p>
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

export default Feeding
