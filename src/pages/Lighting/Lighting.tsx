import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import Input from '@components/common/Input'
import Switch from '@components/common/Switch'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  compareToRecommended,
  dayLengthHours,
  lightingFormSchema,
  petKeyOf,
  recommendedRange,
  seasonForMonth,
  uvbNoteKey,
  useActivePetLighting,
  useLightingStore,
  type LightingFormValues,
} from '@features/lighting'
import { useOnboardingStore } from '@features/onboarding'
import { useSpecies } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Lighting.module.css'

/** Map a measured-vs-target verdict to a Badge variant. */
const VERDICT_VARIANT = {
  low: 'warning',
  ok: 'success',
  high: 'warning',
} as const

/** Pad an hour (0..23) to a `HH:00` clock label. */
function hourLabel(hour: number): string {
  const h = ((Math.trunc(hour) % 24) + 24) % 24
  return `${String(h).padStart(2, '0')}:00`
}

function Lighting() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('lighting.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const { data: activeSpecies } = useSpecies(profile.speciesId ?? undefined)

  const schedule = useActivePetLighting()
  const setSchedule = useLightingStore((s) => s.setSchedule)

  // Season is read once per render from the local clock; the engine math itself
  // is pure and unit-tested.
  const season = useMemo(() => seasonForMonth(new Date().getMonth()), [])
  const category = profile.category

  const form = useForm<LightingFormValues>({
    resolver: zodResolver(lightingFormSchema),
    // Seed from the saved (or default) schedule so the editor opens pre-filled.
    defaultValues: {
      onHour: schedule.onHour,
      offHour: schedule.offHour,
      hasUvb: schedule.hasUvb,
      uvbHours: schedule.uvbHours,
      notes: schedule.notes,
    },
  })

  const { control, register, handleSubmit, setValue, formState } = form

  // Live form values drive the readout + 24h bar so the keeper sees the result
  // before saving. `useWatch` subscribes during render (no effects), matching
  // the codebase convention and keeping the React Compiler happy.
  const onHour = useWatch({ control, name: 'onHour' })
  const offHour = useWatch({ control, name: 'offHour' })
  const hasUvb = useWatch({ control, name: 'hasUvb' })
  const uvbHoursValue = useWatch({ control, name: 'uvbHours' })

  const { dayLength, range, verdict } = useMemo(() => {
    const onN = Number.isFinite(onHour) ? Number(onHour) : schedule.onHour
    const offN = Number.isFinite(offHour) ? Number(offHour) : schedule.offHour
    const len = dayLengthHours(onN, offN)
    const r = recommendedRange(category, season)
    return { dayLength: len, range: r, verdict: compareToRecommended(len, r) }
  }, [onHour, offHour, category, season, schedule.onHour, schedule.offHour])

  // Hours that are lit, as a set, so the 24h bar can shade them regardless of a
  // midnight wrap.
  const litHours = useMemo(() => {
    const onN = ((Math.trunc(Number(onHour) || 0) % 24) + 24) % 24
    const lit = new Set<number>()
    for (let i = 0; i < dayLength; i += 1) lit.add((onN + i) % 24)
    return lit
  }, [onHour, dayLength])

  const numberSetter = (v: unknown) => {
    if (v === '' || v === null || v === undefined) return null
    const num = Number(v)
    return Number.isFinite(num) ? num : null
  }

  const onSubmit = handleSubmit((values) => {
    setSchedule(petKeyOf(activePetId), {
      speciesId: profile.speciesId ?? null,
      onHour: values.onHour,
      offHour: values.offHour,
      hasUvb: values.hasUvb,
      uvbHours: values.hasUvb ? (values.uvbHours ?? null) : null,
      notes: values.notes.trim(),
    })
    toast(t('lighting.saved'), 'success')
  })

  const hourError = (field: 'onHour' | 'offHour') => {
    const msg = formState.errors[field]?.message
    return msg ? t(msg) : undefined
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('lighting.title')}</h1>
        <p className={styles.subtitle}>{t('lighting.subtitle')}</p>
        <div className={styles.context}>
          {activeSpecies && (
            <span className={styles.speciesChip}>
              <span aria-hidden="true">{activeSpecies.heroEmoji}</span> {activeSpecies.koreanName}
            </span>
          )}
          <span className={styles.seasonChip}>
            {t('lighting.seasonContext', { season: t(`lighting.seasons.${season}`) })}
          </span>
        </div>
      </header>

      {/* ── Day-length readout ─────────────────────────────────── */}
      <Card padding="lg">
        <Card.Body>
          <div className={styles.readoutTop}>
            <div>
              <span className={styles.readoutLabel}>{t('lighting.readout.dayLength')}</span>
              <div className={styles.readoutValue}>
                {t('lighting.readout.hours', { hours: dayLength })}
              </div>
            </div>
            <Badge variant={VERDICT_VARIANT[verdict]}>{t(`lighting.verdict.${verdict}`)}</Badge>
          </div>

          <p className={styles.readoutTarget}>
            {t('lighting.readout.target', {
              category: t(`lighting.categories.${category ?? 'reptile'}`),
              season: t(`lighting.seasons.${season}`),
              min: range.min,
              max: range.max,
            })}
          </p>

          {/* 24-hour lit/dark bar. Tokens only; no animation. */}
          <div
            className={styles.dayBar}
            role="img"
            aria-label={t('lighting.bar.aria', {
              on: hourLabel(Number(onHour) || 0),
              off: hourLabel(Number(offHour) || 0),
            })}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <span
                key={h}
                className={`${styles.barCell} ${litHours.has(h) ? styles.barCellLit : ''}`}
              />
            ))}
          </div>
          <div className={styles.barScale} aria-hidden="true">
            <span>00</span>
            <span>06</span>
            <span>12</span>
            <span>18</span>
            <span>24</span>
          </div>
          <p className={styles.verdictHint}>{t(`lighting.verdictHint.${verdict}`)}</p>
        </Card.Body>
      </Card>

      {/* ── Editor ─────────────────────────────────────────────── */}
      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.formTitle}>{t('lighting.form.title')}</h2>
          <p className={styles.formIntro}>{t('lighting.form.intro')}</p>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.formRow}>
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                max="23"
                step="1"
                label={t('lighting.form.onHour')}
                helperText={t('lighting.form.hourHelper')}
                error={hourError('onHour')}
                {...register('onHour', { valueAsNumber: true })}
              />
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                max="23"
                step="1"
                label={t('lighting.form.offHour')}
                helperText={t('lighting.form.hourHelper')}
                error={hourError('offHour')}
                {...register('offHour', { valueAsNumber: true })}
              />
            </div>

            <div className={styles.uvbBlock}>
              <Controller
                control={control}
                name="hasUvb"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={(checked) => {
                      field.onChange(checked)
                      // Seed a sensible UVB on-time when first enabling it.
                      if (checked && !uvbHoursValue) setValue('uvbHours', 10)
                    }}
                    label={t('lighting.form.hasUvb')}
                  />
                )}
              />
              {hasUvb && (
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="24"
                  step="1"
                  label={t('lighting.form.uvbHours')}
                  helperText={t('lighting.form.uvbHoursHelper')}
                  error={
                    formState.errors.uvbHours?.message
                      ? t(formState.errors.uvbHours.message)
                      : undefined
                  }
                  {...register('uvbHours', { setValueAs: numberSetter })}
                />
              )}
            </div>

            <Textarea
              label={t('lighting.form.notes')}
              rows={2}
              helperText={t('lighting.form.notesHelper')}
              error={
                formState.errors.notes?.message ? t(formState.errors.notes.message) : undefined
              }
              {...register('notes')}
            />

            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={formState.isSubmitting}>
                {t('lighting.form.save')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {/* ── UVB guidance ───────────────────────────────────────── */}
      <Alert variant="info" title={t('lighting.uvb.title')}>
        <p>{t(uvbNoteKey(category))}</p>
        <p className={styles.uvbDecay}>{t('lighting.uvb.decay')}</p>
      </Alert>

      <p className={styles.disclaimer}>{t('lighting.disclaimer')}</p>
    </section>
  )
}

export default Lighting
