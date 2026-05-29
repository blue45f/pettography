import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  chartPoints,
  growthNorm,
  growthFormSchema,
  growthStats,
  useActivePetGrowth,
  useGrowthStore,
  type GrowthFormValues,
  type WeightStatus,
} from '@features/growth'
import { useOnboardingStore } from '@features/onboarding'
import { useSpeciesList } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Growth.module.css'

const STATUS_VARIANT: Record<WeightStatus, 'success' | 'warning'> = {
  below: 'warning',
  normal: 'success',
  above: 'warning',
}

const W = 320
const H = 150
const PAD = 12

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function Growth() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('growth.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const pets = useOnboardingStore((s) => s.pets)
  const { data: speciesList = [] } = useSpeciesList({})

  const activeSpecies = useMemo(
    () => speciesList.find((s) => s.id === profile.speciesId) ?? null,
    [speciesList, profile.speciesId],
  )
  const norm = useMemo(() => growthNorm(activeSpecies?.slug), [activeSpecies?.slug])

  const activeEntries = useActivePetGrowth()
  const allEntries = useGrowthStore((s) => s.entries)
  const addEntry = useGrowthStore((s) => s.addEntry)
  const removeEntry = useGrowthStore((s) => s.removeEntry)

  const [showAllPets, setShowAllPets] = useState(false)
  const entries = showAllPets ? allEntries : activeEntries

  const stats = useMemo(() => growthStats(entries, norm), [entries, norm])
  const chart = useMemo(() => chartPoints(entries, norm), [entries, norm])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GrowthFormValues>({
    resolver: zodResolver(growthFormSchema),
    defaultValues: { measuredAt: todayIso(), weightGram: undefined, lengthCm: null, note: '' },
  })

  const onSubmit = handleSubmit((values) => {
    addEntry({
      speciesId: profile.speciesId,
      measuredAt: values.measuredAt,
      weightGram: values.weightGram,
      lengthCm: values.lengthCm ?? null,
      note: values.note,
    })
    toast(t('growth.saved'), 'success')
    reset({ measuredAt: todayIso(), weightGram: undefined, lengthCm: null, note: '' })
  })

  const petLabel = (petId: string | null | undefined) => {
    if (!petId) return null
    const pet = pets.find((p) => p.id === petId)
    if (!pet) return null
    const sp = speciesList.find((s) => s.id === pet.speciesId)
    return { name: pet.petName?.trim() || sp?.koreanName || '', emoji: sp?.heroEmoji ?? '🐾' }
  }
  const showPetBadge = showAllPets && pets.length > 1

  // SVG geometry
  const px = (x: number) => PAD + x * (W - 2 * PAD)
  const py = (y: number) => PAD + (1 - y) * (H - 2 * PAD)
  const range = chart ? chart.maxW - chart.minW || 1 : 1
  const bandTopY = chart && norm ? py((norm.adultWeightMaxG - chart.minW) / range) : 0
  const bandBottomY = chart && norm ? py((norm.adultWeightMinG - chart.minW) / range) : 0
  const polyline = chart ? chart.points.map((p) => `${px(p.x)},${py(p.y)}`).join(' ') : ''

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('growth.title')}</h1>
        <p className={styles.subtitle}>{t('growth.subtitle')}</p>
        {activeSpecies && (
          <p className={styles.speciesNote}>
            <span aria-hidden="true">{activeSpecies.heroEmoji}</span> {activeSpecies.koreanName}
            {norm && (
              <span className={styles.normNote}>
                {' · '}
                {t('growth.adultBand', { min: norm.adultWeightMinG, max: norm.adultWeightMaxG })}
              </span>
            )}
          </p>
        )}
        {pets.length > 1 && (
          <label className={styles.showAllToggle}>
            <input
              type="checkbox"
              checked={showAllPets}
              onChange={(e) => setShowAllPets(e.target.checked)}
            />
            {t('growth.showAllPets')}
          </label>
        )}
      </header>

      <Card padding="lg" className={styles.statsCard}>
        <Card.Body>
          <div className={styles.statsHead}>
            <h2 className={styles.cardTitle}>{t('growth.stats.title')}</h2>
            {stats.status && (
              <Badge variant={STATUS_VARIANT[stats.status]}>
                {t(`growth.status.${stats.status}`)}
              </Badge>
            )}
          </div>
          <dl className={styles.statsGrid}>
            <div>
              <dt>{t('growth.stats.latest')}</dt>
              <dd>{stats.latestWeight !== null ? `${stats.latestWeight} g` : '—'}</dd>
            </div>
            <div>
              <dt>{t('growth.stats.change')}</dt>
              <dd>
                {stats.change
                  ? `${stats.change.deltaG > 0 ? '+' : ''}${stats.change.deltaG} g (${stats.change.pct > 0 ? '+' : ''}${stats.change.pct}%)`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>{t('growth.stats.rate')}</dt>
              <dd>
                {stats.ratePerWeek !== null ? t('growth.perWeek', { g: stats.ratePerWeek }) : '—'}
              </dd>
            </div>
            <div>
              <dt>{t('growth.stats.length')}</dt>
              <dd>{stats.latestLength !== null ? `${stats.latestLength} cm` : '—'}</dd>
            </div>
          </dl>
        </Card.Body>
      </Card>

      {chart && (
        <Card padding="lg">
          <Card.Body>
            <h2 className={styles.cardTitle}>{t('growth.chart.title')}</h2>
            <svg
              className={styles.chart}
              viewBox={`0 0 ${W} ${H}`}
              role="img"
              aria-label={t('growth.chart.aria', {
                count: chart.points.length,
                min: chart.minW,
                max: chart.maxW,
              })}
              preserveAspectRatio="none"
            >
              {norm && (
                <rect
                  x={PAD}
                  y={Math.min(bandTopY, bandBottomY)}
                  width={W - 2 * PAD}
                  height={Math.abs(bandBottomY - bandTopY)}
                  className={styles.band}
                />
              )}
              {chart.points.length > 1 && (
                <polyline points={polyline} className={styles.line} fill="none" />
              )}
              {chart.points.map((p) => (
                <circle key={p.measuredAt} cx={px(p.x)} cy={py(p.y)} r={3} className={styles.dot} />
              ))}
            </svg>
            {norm && (
              <p className={styles.legend}>
                <span className={styles.legendSwatch} aria-hidden="true" />{' '}
                {t('growth.chart.bandLegend')}
              </p>
            )}
          </Card.Body>
        </Card>
      )}

      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.cardTitle}>{t('growth.form.title')}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.formRow}>
              <Input
                type="date"
                label={t('growth.form.date')}
                error={errors.measuredAt?.message ? t(errors.measuredAt.message) : undefined}
                {...register('measuredAt')}
              />
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                label={t('growth.form.weight')}
                error={errors.weightGram?.message ? t(errors.weightGram.message) : undefined}
                {...register('weightGram', { valueAsNumber: true })}
              />
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                label={t('growth.form.length')}
                helperText={t('growth.form.lengthOptional')}
                error={errors.lengthCm?.message ? t(errors.lengthCm.message) : undefined}
                {...register('lengthCm', {
                  setValueAs: (v: unknown) => {
                    if (v === '' || v === null || v === undefined) return null
                    const n = Number(v)
                    return Number.isFinite(n) ? n : null
                  },
                })}
              />
            </div>
            <Textarea
              label={t('growth.form.note')}
              rows={2}
              error={errors.note?.message ? t(errors.note.message) : undefined}
              {...register('note')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('growth.form.submit')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {entries.length === 0 ? (
        <EmptyState icon="📈" title={t('growth.emptyTitle')} description={t('growth.emptyDesc')} />
      ) : (
        <ul className={styles.list}>
          {[...entries]
            .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
            .map((entry) => {
              const label = petLabel(entry.petId)
              return (
                <li key={entry.id}>
                  <Card padding="md">
                    <Card.Body>
                      <div className={styles.entryHead}>
                        <div className={styles.entryLeft}>
                          <span className={styles.entryWeight}>{entry.weightGram} g</span>
                          {entry.lengthCm !== null && (
                            <Badge variant="default">{entry.lengthCm} cm</Badge>
                          )}
                          <span className={styles.entryDate}>{entry.measuredAt}</span>
                          {showPetBadge && label && (
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
                          {t('growth.remove')}
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
  )
}

export default Growth
