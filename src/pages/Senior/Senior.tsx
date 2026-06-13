import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Progress from '@components/common/Progress'
import Select from '@components/common/Select'
import Switch from '@components/common/Switch'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import { useOnboardingStore } from '@domains/onboarding'
import {
  ACQUIRED_AS_OPTIONS,
  SENIOR_CHECKLIST,
  checklistProgress,
  expectedRemainingYears,
  isSeniorStage,
  lifeProgressPct,
  lifeStage,
  monthsToYears,
  seniorFormSchema,
  tipsForCategory,
  useActivePetSenior,
  useSeniorStore,
  yearsToMonths,
  type LifeStage,
  type SeniorFormValues,
} from '@domains/senior'
import { useSpeciesList } from '@domains/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Senior.module.css'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'

const STAGE_BADGE: Record<LifeStage, BadgeVariant> = {
  juvenile: 'default',
  adult: 'primary',
  senior: 'warning',
  geriatric: 'error',
}

const PROGRESS_VARIANT: Record<LifeStage, 'primary' | 'warning' | 'error'> = {
  juvenile: 'primary',
  adult: 'primary',
  senior: 'warning',
  geriatric: 'error',
}

function roundYears(years: number): number {
  return Math.round(years * 10) / 10
}

function Senior() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('senior.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const { data: speciesList = [] } = useSpeciesList({})

  const activeSpecies = useMemo(
    () => speciesList.find((s) => s.id === profile.speciesId) ?? null,
    [speciesList, profile.speciesId],
  )

  const seniorProfile = useActivePetSenior()
  const upsertProfile = useSeniorStore((s) => s.upsertProfile)
  const toggleChecklistItem = useSeniorStore((s) => s.toggleChecklistItem)

  const ageYears = useMemo(
    () => (seniorProfile.ageMonths === null ? null : monthsToYears(seniorProfile.ageMonths)),
    [seniorProfile.ageMonths],
  )

  const hasLifespan = Boolean(
    activeSpecies && activeSpecies.lifespanMaxYears > 0 && activeSpecies.lifespanMinYears > 0,
  )

  const stage = useMemo<LifeStage | null>(() => {
    if (ageYears === null || !activeSpecies) return null
    return lifeStage(ageYears, activeSpecies.lifespanMinYears, activeSpecies.lifespanMaxYears)
  }, [ageYears, activeSpecies])

  const progressPct = useMemo<number | null>(() => {
    if (ageYears === null || !activeSpecies) return null
    return lifeProgressPct(ageYears, activeSpecies.lifespanMaxYears)
  }, [ageYears, activeSpecies])

  const remainingYears = useMemo<number | null>(() => {
    if (ageYears === null || !activeSpecies) return null
    return expectedRemainingYears(
      ageYears,
      activeSpecies.lifespanMinYears,
      activeSpecies.lifespanMaxYears,
    )
  }, [ageYears, activeSpecies])

  const senior = isSeniorStage(stage)

  const tipIds = useMemo(() => tipsForCategory(activeSpecies?.category), [activeSpecies?.category])

  const checklistStats = useMemo(
    () => checklistProgress(SENIOR_CHECKLIST, seniorProfile.checklist),
    [seniorProfile.checklist],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SeniorFormValues>({
    resolver: zodResolver(seniorFormSchema),
    values: {
      ageYears: ageYears === null ? 0 : roundYears(ageYears),
      acquiredAs: seniorProfile.acquiredAs,
      notes: seniorProfile.notes,
    },
  })

  const onSubmit = handleSubmit((data) => {
    upsertProfile({
      ageMonths: yearsToMonths(data.ageYears),
      acquiredAs: data.acquiredAs,
      notes: data.notes,
    })
    toast(t('senior.saved'), 'success')
  })

  const noPet = !activeSpecies

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('senior.title')}</h1>
        <p className={styles.subtitle}>{t('senior.subtitle')}</p>
        {activeSpecies && (
          <p className={styles.speciesNote}>
            <span aria-hidden="true">{activeSpecies.heroEmoji}</span>{' '}
            {profile.petName?.trim() || activeSpecies.koreanName}
            {hasLifespan && (
              <span className={styles.lifespanNote}>
                {' · '}
                {t('senior.lifespanRange', {
                  min: activeSpecies.lifespanMinYears,
                  max: activeSpecies.lifespanMaxYears,
                })}
              </span>
            )}
          </p>
        )}
      </header>

      {noPet ? (
        <EmptyState
          icon="🌿"
          title={t('senior.empty.noPetTitle')}
          description={t('senior.empty.noPetDesc')}
        />
      ) : (
        <>
          {/* Life-stage card — primary */}
          {stage && hasLifespan ? (
            <Card padding="lg" className={styles.stageCard}>
              <Card.Body>
                <div className={styles.stageHead}>
                  <div className={styles.stageHeadText}>
                    <span className={styles.stageEyebrow}>{t('senior.stage.eyebrow')}</span>
                    <Badge variant={STAGE_BADGE[stage]} className={styles.stageBadge}>
                      {t(`senior.stage.${stage}`)}
                    </Badge>
                  </div>
                  <p className={styles.ageReadout}>
                    {t('senior.stage.ageReadout', { years: roundYears(ageYears ?? 0) })}
                  </p>
                </div>

                <p className={styles.stageBlurb}>{t(`senior.stageBlurb.${stage}`)}</p>

                <div className={styles.progressBlock}>
                  <div className={styles.progressLabels}>
                    <span>{t('senior.progress.label')}</span>
                    <span className={styles.progressPct}>
                      {progressPct !== null ? `${Math.round(progressPct)}%` : '—'}
                    </span>
                  </div>
                  <Progress
                    value={progressPct ?? 0}
                    variant={PROGRESS_VARIANT[stage]}
                    label={t('senior.progress.aria', {
                      pct: progressPct !== null ? Math.round(progressPct) : 0,
                    })}
                  />
                  <div className={styles.progressScale}>
                    <span>0</span>
                    <span>
                      {t('senior.progress.maxYears', { max: activeSpecies.lifespanMaxYears })}
                    </span>
                  </div>
                </div>

                <dl className={styles.metricGrid}>
                  <div>
                    <dt>{t('senior.metric.remaining')}</dt>
                    <dd>
                      {remainingYears !== null
                        ? t('senior.metric.years', { years: remainingYears })
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('senior.metric.lifespan')}</dt>
                    <dd>
                      {t('senior.metric.range', {
                        min: activeSpecies.lifespanMinYears,
                        max: activeSpecies.lifespanMaxYears,
                      })}
                    </dd>
                  </div>
                </dl>
                <p className={styles.estimateNote}>{t('senior.metric.estimateNote')}</p>
              </Card.Body>
            </Card>
          ) : (
            <Card padding="lg">
              <Card.Body>
                <EmptyState
                  icon="🗓️"
                  title={
                    hasLifespan ? t('senior.empty.noAgeTitle') : t('senior.empty.noLifespanTitle')
                  }
                  description={
                    hasLifespan
                      ? t('senior.empty.noAgeDesc')
                      : t('senior.empty.noLifespanDesc', { name: activeSpecies.koreanName })
                  }
                  headingLevel={2}
                />
              </Card.Body>
            </Card>
          )}

          {/* Age / acquired-as form */}
          <Card padding="lg">
            <Card.Body>
              <h2 className={styles.cardTitle}>{t('senior.form.title')}</h2>
              <form onSubmit={onSubmit} className={styles.form} noValidate>
                <div className={styles.formRow}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    label={t('senior.form.age')}
                    helperText={t('senior.form.ageHelper')}
                    error={errors.ageYears?.message ? t(errors.ageYears.message) : undefined}
                    {...register('ageYears', { valueAsNumber: true })}
                  />
                  <Select
                    label={t('senior.form.acquiredAs')}
                    helperText={t('senior.form.acquiredAsHelper')}
                    options={ACQUIRED_AS_OPTIONS.map((a) => ({
                      value: a,
                      label: t(`senior.acquiredAs.${a}`),
                    }))}
                    {...register('acquiredAs')}
                  />
                </div>
                <Textarea
                  label={t('senior.form.notes')}
                  rows={3}
                  placeholder={t('senior.form.notesPlaceholder')}
                  error={errors.notes?.message ? t(errors.notes.message) : undefined}
                  {...register('notes')}
                />
                <div className={styles.formActions}>
                  <Button type="submit" variant="primary" isLoading={isSubmitting}>
                    {t('senior.form.submit')}
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>

          {/* Senior care recommendations */}
          {tipIds.length > 0 && (
            <Card padding="lg" className={senior ? styles.tipsEmphasis : undefined}>
              <Card.Body>
                <div className={styles.tipsHead}>
                  <h2 className={styles.cardTitle}>{t('senior.tipsTitle')}</h2>
                  {senior && <Badge variant="warning">{t('senior.tipsActive')}</Badge>}
                </div>
                <p className={styles.tipsLead}>
                  {senior ? t('senior.tipsLeadSenior') : t('senior.tipsLeadEarly')}
                </p>
                <ul className={styles.tipList}>
                  {tipIds.map((id) => (
                    <li key={id} className={styles.tipItem}>
                      <span className={styles.tipMarker} aria-hidden="true" />
                      <span>{t(`senior.tips.${id}`)}</span>
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          )}

          {/* Senior checklist */}
          <Card padding="lg">
            <Card.Body>
              <div className={styles.checklistHead}>
                <h2 className={styles.cardTitle}>{t('senior.checklistTitle')}</h2>
                <span className={styles.checklistCount}>
                  {t('senior.checklistCount', {
                    done: checklistStats.done,
                    total: checklistStats.total,
                  })}
                </span>
              </div>
              <Progress
                value={checklistStats.pct}
                variant="success"
                className={styles.checklistProgress}
                label={t('senior.checklistAria', { pct: checklistStats.pct })}
              />
              <ul className={styles.checklist}>
                {SENIOR_CHECKLIST.map((id) => {
                  const checked = Boolean(seniorProfile.checklist[id])
                  return (
                    <li key={id} className={styles.checklistItem}>
                      <Switch
                        checked={checked}
                        onChange={(next) => toggleChecklistItem(id, next)}
                        label={t(`senior.checklist.${id}`)}
                      />
                    </li>
                  )
                })}
              </ul>
            </Card.Body>
          </Card>
        </>
      )}
    </section>
  )
}

export default Senior
