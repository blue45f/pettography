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
  cycleStatus,
  latestReading,
  paramFlags,
  trend,
  useActivePetReadings,
  useWaterStore,
  WATER_PARAMS,
  waterFormSchema,
  type CycleStatus,
  type ParamFlag,
  type WaterFormValues,
  type WaterParam,
  type WaterReading,
} from '@domains/water'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { buildCsv } from '@utils/csv'
import { downloadTextFile } from '@utils/download'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Water.module.css'

function todayIso(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

/** Empty number inputs return null so "blank" stays "not measured". */
function nullableNumber(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null
  const num = Number(v)
  return Number.isFinite(num) ? num : null
}

const STATUS_BADGE: Record<CycleStatus, 'success' | 'warning' | 'error' | 'default'> = {
  cycled: 'success',
  cycling: 'warning',
  toxic: 'error',
  unknown: 'default',
}

const PARAM_UNIT: Record<WaterParam, string> = {
  tempC: '°C',
  ph: '',
  ammoniaPpm: 'ppm',
  nitritePpm: 'ppm',
  nitratePpm: 'ppm',
}

const CHIP_FLAG_CLASS: Record<ParamFlag, string> = {
  ok: styles.chipOk,
  warn: styles.chipWarn,
  danger: styles.chipDanger,
}

function formatParam(reading: WaterReading, key: WaterParam): string | null {
  const value = reading[key]
  if (value === null) return null
  return `${value}${PARAM_UNIT[key] ? ` ${PARAM_UNIT[key]}` : ''}`
}

function Water() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('water.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const pets = useOnboardingStore((s) => s.pets)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const activeReadings = useActivePetReadings()
  const allReadings = useWaterStore((s) => s.readings)
  const addReading = useWaterStore((s) => s.addReading)
  const removeReading = useWaterStore((s) => s.removeReading)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)
  const { data: speciesList = [] } = useSpeciesList({})

  const [showAllPets, setShowAllPets] = useState(false)
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const readings = showAllPets ? allReadings : activeReadings
  const showPetBadge = showAllPets && pets.length > 1

  // Axolotls and amphibians (frogs) are the aquatic/semi-aquatic catalog species.
  const isAquatic =
    profile.category === 'amphibian' ||
    species?.slug === 'axolotl' ||
    species?.slug === 'pacman-frog'

  // All-pet mode affects history/export only. Status and trends must describe
  // the active animal's enclosure rather than blending unrelated habitats.
  const latest = useMemo(() => latestReading(activeReadings), [activeReadings])
  const status: CycleStatus = latest ? cycleStatus(latest) : 'unknown'
  const flags = useMemo(() => (latest ? paramFlags(latest) : null), [latest])
  const nitrateTrend = useMemo(() => trend(activeReadings, 'nitratePpm'), [activeReadings])

  const petLabels = useMemo(() => {
    const speciesById = new Map(speciesList.map((item) => [item.id, item]))
    return new Map(
      pets.map((pet) => {
        const petSpecies = pet.speciesId ? speciesById.get(pet.speciesId) : undefined
        return [
          pet.id,
          {
            name: pet.petName?.trim() || petSpecies?.koreanName || t('water.pet'),
            emoji: petSpecies?.heroEmoji ?? '🐾',
          },
        ] as const
      })
    )
  }, [pets, speciesList, t])

  function petLabel(petId: string | null | undefined): { name: string; emoji: string } | null {
    if (!petId) return null
    return petLabels.get(petId) ?? null
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WaterFormValues>({
    resolver: zodResolver(waterFormSchema),
    defaultValues: {
      measuredAt: todayIso(),
      tempC: null,
      ph: null,
      ammoniaPpm: null,
      nitritePpm: null,
      nitratePpm: null,
      note: '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    addReading({
      speciesId: profile.speciesId,
      measuredAt: values.measuredAt,
      tempC: values.tempC ?? null,
      ph: values.ph ?? null,
      ammoniaPpm: values.ammoniaPpm ?? null,
      nitritePpm: values.nitritePpm ?? null,
      nitratePpm: values.nitratePpm ?? null,
      note: values.note?.trim() || '',
    })
    toast(t('common.save'), 'success')
    reset({
      measuredAt: todayIso(),
      tempC: null,
      ph: null,
      ammoniaPpm: null,
      nitritePpm: null,
      nitratePpm: null,
      note: '',
    })
  })

  function exportCsv() {
    const rows = [...readings]
      .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
      .map((r) => [
        r.measuredAt,
        r.tempC ?? '',
        r.ph ?? '',
        r.ammoniaPpm ?? '',
        r.nitritePpm ?? '',
        r.nitratePpm ?? '',
        r.note ?? '',
      ])
    downloadTextFile(
      'pettography-water.csv',
      buildCsv(['date', 'temp_c', 'ph', 'ammonia_ppm', 'nitrite_ppm', 'nitrate_ppm', 'note'], rows),
      'text/csv;charset=utf-8'
    )
  }

  function confirmRemove(id: string) {
    removeReading(id)
    setPendingRemoveId(null)
    toast(t('common.delete'), 'success')
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('water.title')}</h1>
        <p className={styles.subtitle}>{t('water.subtitle')}</p>
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
            {t('water.showAllPets')}
          </label>
        )}
        {readings.length > 0 && (
          <Button variant="secondary" onClick={exportCsv} className={styles.exportButton}>
            {t('common.exportCsv')}
          </Button>
        )}
      </header>

      {!isAquatic && <Alert variant="info">{t('water.notAquatic')}</Alert>}

      <Card padding="lg" className={styles.statusCard}>
        <Card.Body>
          <div className={styles.statusHead}>
            <h2 className={styles.statusTitle}>{t('water.status.title')}</h2>
            <Badge variant={STATUS_BADGE[status]} className={styles.statusBadge}>
              {t(`water.status.${status}`)}
            </Badge>
          </div>
          <p className={styles.statusExplain}>{t(`water.statusExplain.${status}`)}</p>

          {latest && flags ? (
            <>
              <p className={styles.measuredLine}>
                {t('water.measuredOn', { date: latest.measuredAt })}
              </p>
              <ul className={styles.chips}>
                {WATER_PARAMS.map((key) => {
                  const display = formatParam(latest, key)
                  const flag = flags[key]
                  return (
                    <li key={key} className={`${styles.chip} ${CHIP_FLAG_CLASS[flag]}`}>
                      <span className={styles.chipLabel}>{t(`water.params.${key}`)}</span>
                      <span className={styles.chipValue}>
                        {display ?? (
                          <span className={styles.chipUnit}>{t('water.notMeasured')}</span>
                        )}
                      </span>
                      {display && (
                        <span className={styles.chipFlag}>{t(`water.flags.${flag}`)}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            <p className={styles.measuredLine}>{t('water.noReadings')}</p>
          )}

          {status === 'toxic' && (
            <Alert variant="error" title={t('water.toxicAlertTitle')}>
              <p>{t('water.toxicAlert')}</p>
              <div className={styles.toxicActions}>
                <Link to="/hospitals" className={styles.actionLink}>
                  {t('nav.hospitals')}
                </Link>
                <Link to="/sos" className={styles.actionLink}>
                  {t('nav.sos')}
                </Link>
              </div>
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.formTitle}>{t('water.newReading')}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <Input
              type="date"
              max={todayIso()}
              label={t('water.params.measuredAt')}
              error={errors.measuredAt?.message ? t(errors.measuredAt.message) : undefined}
              {...register('measuredAt')}
            />
            <div className={styles.paramGrid}>
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                max="60"
                label={t('water.params.tempC')}
                error={errors.tempC?.message ? t(errors.tempC.message) : undefined}
                {...register('tempC', { setValueAs: nullableNumber })}
              />
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                max="14"
                label={t('water.params.ph')}
                error={errors.ph?.message ? t(errors.ph.message) : undefined}
                {...register('ph', { setValueAs: nullableNumber })}
              />
              <Input
                type="number"
                inputMode="decimal"
                step="0.05"
                min="0"
                max="100"
                label={t('water.params.ammoniaPpm')}
                error={errors.ammoniaPpm?.message ? t(errors.ammoniaPpm.message) : undefined}
                {...register('ammoniaPpm', { setValueAs: nullableNumber })}
              />
              <Input
                type="number"
                inputMode="decimal"
                step="0.05"
                min="0"
                max="100"
                label={t('water.params.nitritePpm')}
                error={errors.nitritePpm?.message ? t(errors.nitritePpm.message) : undefined}
                {...register('nitritePpm', { setValueAs: nullableNumber })}
              />
              <Input
                type="number"
                inputMode="decimal"
                step="1"
                min="0"
                max="500"
                label={t('water.params.nitratePpm')}
                error={errors.nitratePpm?.message ? t(errors.nitratePpm.message) : undefined}
                {...register('nitratePpm', { setValueAs: nullableNumber })}
              />
            </div>
            <Textarea
              label={t('water.params.note')}
              rows={2}
              maxLength={200}
              error={errors.note?.message ? t(errors.note.message) : undefined}
              {...register('note')}
            />
            <p className={styles.kitNote}>{t('water.kitNote')}</p>
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('water.addReading')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      <h2 className={styles.sectionTitle}>{t('water.historyTitle')}</h2>

      {!showAllPets && nitrateTrend.length >= 3 && (
        <Card padding="md" className={styles.trendCard}>
          <Card.Body>
            <p className={styles.trendTitle}>{t('water.nitrateTrend')}</p>
            <Sparkline
              points={nitrateTrend}
              ariaLabel={t('water.nitrateTrend')}
              formatValue={(v) => `${v} ppm`}
            />
          </Card.Body>
        </Card>
      )}

      {readings.length === 0 ? (
        <EmptyState
          variant="log"
          icon="💧"
          title={t('water.emptyTitle')}
          description={t('water.emptyDesc')}
          hint={t('water.hint')}
        />
      ) : (
        <ul className={styles.list}>
          {[...readings]
            .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
            .map((reading) => {
              const rowFlags = paramFlags(reading)
              const label = petLabel(reading.petId)
              const showLabel = label && (showPetBadge || reading.petId !== activePetId)
              return (
                <li key={reading.id} className={styles.entryItem}>
                  <div className={styles.entryHeader}>
                    <div className={styles.entryHeaderLeft}>
                      <time className={styles.entryDate} dateTime={reading.measuredAt}>
                        {reading.measuredAt}
                      </time>
                      {showLabel && label && (
                        <Badge variant="default">
                          <span aria-hidden="true">{label.emoji}</span> {label.name}
                        </Badge>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles.removeButton}
                      aria-expanded={pendingRemoveId === reading.id}
                      aria-controls={`water-remove-${reading.id}`}
                      onClick={() =>
                        setPendingRemoveId((current) =>
                          current === reading.id ? null : reading.id
                        )
                      }
                    >
                      {t('water.remove')}
                    </button>
                  </div>
                  <ul className={styles.summary}>
                    {WATER_PARAMS.map((key) => {
                      const display = formatParam(reading, key)
                      if (display === null) return null
                      const flag = rowFlags[key]
                      const flagClass =
                        flag === 'danger'
                          ? styles.summaryDanger
                          : flag === 'warn'
                            ? styles.summaryWarn
                            : ''
                      return (
                        <li key={key}>
                          <span className={styles.summaryKey}>{t(`water.paramsShort.${key}`)}</span>
                          <span className={flagClass}>{display}</span>
                          <span className={styles.summaryFlag}>{t(`water.flags.${flag}`)}</span>
                        </li>
                      )
                    })}
                  </ul>
                  {reading.note && <p className={styles.entryNote}>{reading.note}</p>}
                  {!reading.speciesId && (
                    <p className={styles.entryFooter}>{t('water.speciesUnknown')}</p>
                  )}
                  {pendingRemoveId === reading.id && (
                    <div id={`water-remove-${reading.id}`} className={styles.deleteConfirm}>
                      <span className={styles.deletePrompt}>{t('water.remove')}?</span>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => setPendingRemoveId(null)}
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="button"
                        className={styles.confirmButton}
                        onClick={() => confirmRemove(reading.id)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
        </ul>
      )}
    </section>
  )
}

export default Water
