import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Sparkline from '@components/common/Sparkline'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  BCS_SCORES,
  bcsFormSchema,
  bcsStats,
  bcsTrend,
  scaleFor,
  scoreLabel,
  statusForScore,
  useActivePetBcs,
  useBcsStore,
  type BcsFormValues,
  type BcsStatus,
} from '@features/bcs'
import { useOnboardingStore } from '@features/onboarding'
import { useSpecies, useSpeciesList } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Bcs.module.css'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_BADGE: Record<BcsStatus, 'warning' | 'success'> = {
  under: 'warning',
  ideal: 'success',
  over: 'warning',
}

function Bcs() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('bcs.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const pets = useOnboardingStore((s) => s.pets)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const activeEntries = useActivePetBcs()
  const allEntries = useBcsStore((s) => s.entries)
  const addEntry = useBcsStore((s) => s.addEntry)
  const removeEntry = useBcsStore((s) => s.removeEntry)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)
  const { data: speciesList = [] } = useSpeciesList({})

  const [showAllPets, setShowAllPets] = useState(false)
  const entries = showAllPets ? allEntries : activeEntries
  const showPetBadge = showAllPets && pets.length > 1

  const scale = useMemo(() => scaleFor(profile.category), [profile.category])
  const stats = useMemo(() => bcsStats(entries), [entries])
  const trendValues = useMemo(() => bcsTrend(entries), [entries])
  const sparkPoints = useMemo(() => trendValues.map((v, i) => ({ x: i, y: v })), [trendValues])

  function petLabel(petId: string | null | undefined): { name: string; emoji: string } | null {
    if (!petId) return null
    const pet = pets.find((p) => p.id === petId)
    if (!pet) return null
    const sp = speciesList.find((s) => s.id === pet.speciesId)
    return {
      name: pet.petName?.trim() || sp?.koreanName || t('bcs.petFallback'),
      emoji: sp?.heroEmoji ?? '🐾',
    }
  }

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BcsFormValues>({
    resolver: zodResolver(bcsFormSchema),
    defaultValues: {
      assessedAt: todayIso(),
      score: 3,
      note: '',
    },
  })

  const selectedScore = useWatch({ control, name: 'score' })

  const onSubmit = handleSubmit((values) => {
    addEntry({
      speciesId: profile.speciesId,
      assessedAt: values.assessedAt,
      score: values.score,
      note: values.note,
    })
    toast(t('bcs.saved'), 'success')
    reset({ assessedAt: todayIso(), score: values.score, note: '' })
  })

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('bcs.title')}</h1>
        <p className={styles.subtitle}>{t('bcs.subtitle')}</p>
        {species && (
          <p className={styles.speciesNote}>
            {species.heroEmoji} {species.koreanName}
          </p>
        )}
        {pets.length > 1 && (
          <label className={styles.showAllToggle}>
            <input
              type="checkbox"
              checked={showAllPets}
              onChange={(e) => setShowAllPets(e.target.checked)}
            />
            {t('bcs.showAllPets')}
          </label>
        )}
      </header>

      <Alert variant="info">{t('bcs.intro')}</Alert>

      {stats.latestScore !== null && stats.latestStatus !== null && (
        <Card padding="lg" className={styles.latestCard}>
          <Card.Body>
            <div className={styles.latestRow}>
              <div className={styles.latestScoreBlock}>
                <span className={styles.latestLabel}>{t('bcs.latest.label')}</span>
                <span className={styles.latestScore}>
                  {stats.latestScore}
                  <span className={styles.latestScoreMax}>/5</span>
                </span>
                <span className={styles.latestScoreName}>{t(scoreLabel(stats.latestScore))}</span>
              </div>
              <div className={styles.latestMeta}>
                <Badge variant={STATUS_BADGE[stats.latestStatus]}>
                  {t(`bcs.status.${stats.latestStatus}`)}
                </Badge>
                <span className={styles.latestAvg}>
                  {t('bcs.latest.average', { value: stats.averageScore ?? 0 })}
                </span>
                <span className={styles.latestCount}>
                  {t('bcs.latest.count', { count: stats.total })}
                </span>
              </div>
            </div>
            {sparkPoints.length >= 3 && (
              <div className={styles.trend}>
                <span className={styles.trendLabel}>{t('bcs.trend.label')}</span>
                <Sparkline
                  points={sparkPoints}
                  height={120}
                  ariaLabel={t('bcs.trend.aria', { count: sparkPoints.length })}
                  formatValue={(v) => `${v}`}
                />
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.sectionTitle}>{t('bcs.scaleTitle')}</h2>
          <p className={styles.sectionDesc}>{t('bcs.scaleDesc')}</p>
          <ol className={styles.scaleList}>
            {scale.map((level) => {
              const status = statusForScore(level.score)
              const isLatest = stats.latestScore === level.score
              return (
                <li
                  key={level.score}
                  className={`${styles.scaleItem} ${isLatest ? styles.scaleItemActive : ''}`}
                  aria-current={isLatest ? 'true' : undefined}
                >
                  <div className={styles.scaleItemHead}>
                    <span className={styles.scaleScore}>{level.score}</span>
                    <span className={styles.scaleName}>{t(scoreLabel(level.score))}</span>
                    <Badge variant={status === 'ideal' ? 'success' : 'warning'}>
                      {t(`bcs.status.${status}`)}
                    </Badge>
                    {isLatest && <Badge variant="primary">{t('bcs.scale.currentTag')}</Badge>}
                  </div>
                  <p className={styles.scaleText}>{t(level.descKey)}</p>
                </li>
              )
            })}
          </ol>
          <p className={styles.statusLegend}>{t('bcs.statusLegend')}</p>
        </Card.Body>
      </Card>

      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.sectionTitle}>{t('bcs.newEntry')}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <Input
              type="date"
              label={t('bcs.assessedAt')}
              error={errors.assessedAt?.message ? t(errors.assessedAt.message) : undefined}
              {...register('assessedAt')}
            />
            <fieldset className={styles.scoreField}>
              <legend className={styles.scoreLegend}>{t('bcs.score')}</legend>
              <div className={styles.segmented} role="group" aria-label={t('bcs.score')}>
                {BCS_SCORES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.segment} ${selectedScore === value ? styles.segmentActive : ''}`}
                    aria-pressed={selectedScore === value}
                    onClick={() => setValue('score', value, { shouldValidate: true })}
                  >
                    <span className={styles.segmentScore}>{value}</span>
                    <span className={styles.segmentName}>{t(scoreLabel(value))}</span>
                  </button>
                ))}
              </div>
              {errors.score?.message && (
                <span className={styles.fieldError}>{t(errors.score.message)}</span>
              )}
              <p className={styles.scoreHint}>{t('bcs.scoreHint')}</p>
            </fieldset>
            <Textarea
              label={t('bcs.note')}
              rows={3}
              placeholder={t('bcs.notePlaceholder')}
              error={errors.note?.message ? t(errors.note.message) : undefined}
              {...register('note')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('bcs.addEntry')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      <section className={styles.historySection}>
        <h2 className={styles.sectionTitle}>{t('bcs.historyTitle')}</h2>
        {entries.length === 0 ? (
          <EmptyState
            icon="⚖️"
            title={t('bcs.emptyTitle')}
            description={t('bcs.emptyDesc')}
            headingLevel={3}
          />
        ) : (
          <ul className={styles.list}>
            {entries.map((entry) => {
              const status = statusForScore(entry.score)
              const label = petLabel(entry.petId)
              const showBadge = label && (showPetBadge || entry.petId !== activePetId)
              return (
                <li key={entry.id}>
                  <Card padding="md">
                    <Card.Body>
                      <div className={styles.entryHeader}>
                        <div className={styles.entryHeaderLeft}>
                          <span className={styles.entryScore}>
                            {entry.score}
                            <span className={styles.entryScoreMax}>/5</span>
                          </span>
                          <Badge variant={status === 'ideal' ? 'success' : 'warning'}>
                            {t(`bcs.status.${status}`)}
                          </Badge>
                          <span className={styles.entryName}>{t(scoreLabel(entry.score))}</span>
                          <span className={styles.entryDate}>{entry.assessedAt}</span>
                          {showBadge && label && (
                            <Badge variant="default">
                              <span aria-hidden="true">{label.emoji}</span> {label.name}
                            </Badge>
                          )}
                        </div>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => removeEntry(entry.id)}
                        >
                          {t('bcs.remove')}
                        </button>
                      </div>
                      {entry.note && <p className={styles.entryNote}>{entry.note}</p>}
                    </Card.Body>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Alert variant="warning">{t('bcs.vetNote')}</Alert>
    </section>
  )
}

export default Bcs
