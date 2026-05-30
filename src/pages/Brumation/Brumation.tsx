import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Progress from '@components/common/Progress'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  BRUMATION_PHASES,
  SAFETY_NOTES,
  brumationFormSchema,
  currentPhase,
  defaultDaysFor,
  endDate,
  phaseDuration,
  phaseSchedule,
  progressPct,
  totalDays,
  useActivePetPlans,
  useBrumationStore,
  type BrumationFormValues,
  type BrumationPhaseId,
  type BrumationPlan,
  type PhaseDays,
} from '@features/brumation'
import { useOnboardingStore } from '@features/onboarding'
import { useSpecies, useSpeciesList } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useToday } from '@hooks/useToday'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Brumation.module.css'

/** Signed whole-day count from today to a `YYYY-MM-DD` date. */
function daysUntil(dateISO: string, todayISO: string): number {
  const ms = 86_400_000
  const toUtc = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).getTime()
  return Math.round((toUtc(dateISO) - toUtc(todayISO)) / ms)
}

function Brumation() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('brumation.title'))

  const today = useToday()
  const profile = useOnboardingStore((s) => s.profile)
  const { data: activeSpecies } = useSpecies(profile.speciesId ?? undefined)
  const { data: speciesList = [] } = useSpeciesList({})

  const plans = useActivePetPlans()
  const addPlan = useBrumationStore((s) => s.addPlan)
  const removePlan = useBrumationStore((s) => s.removePlan)

  // The plan whose timeline is shown. Defaults to the most recent (plans are
  // stored newest-first); a user pick overrides it. Falls back gracefully when
  // the selected plan is removed.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedPlan =
    plans.find((p) => p.id === selectedId) ?? (plans.length > 0 ? plans[0] : null)

  const isReptile = profile.category === 'reptile'

  /** A friendly emoji + Korean name for a species id, with a safe fallback. */
  function speciesLabel(speciesId: string | null | undefined): { name: string; emoji: string } {
    const sp = speciesId ? speciesList.find((s) => s.id === speciesId) : undefined
    return { name: sp?.koreanName ?? t('brumation.speciesUnknown'), emoji: sp?.heroEmoji ?? '🦎' }
  }

  // ── Create form ────────────────────────────────────────────────
  const form = useForm<BrumationFormValues>({
    resolver: zodResolver(brumationFormSchema),
    defaultValues: {
      startDate: today,
      vetCheck: defaultDaysFor('vetCheck'),
      fasting: defaultDaysFor('fasting'),
      coolDown: defaultDaysFor('coolDown'),
      dormancy: defaultDaysFor('dormancy'),
      warmUp: defaultDaysFor('warmUp'),
      recovery: defaultDaysFor('recovery'),
      targetTempC: null,
      notes: '',
    },
  })

  const numberSetter = (v: unknown) => {
    if (v === '' || v === null || v === undefined) return null
    const num = Number(v)
    return Number.isFinite(num) ? num : null
  }

  const onCreate = form.handleSubmit((values) => {
    const phaseDays: PhaseDays = {
      vetCheck: values.vetCheck,
      fasting: values.fasting,
      coolDown: values.coolDown,
      dormancy: values.dormancy,
      warmUp: values.warmUp,
      recovery: values.recovery,
    }
    const plan = addPlan({
      speciesId: profile.speciesId,
      startDate: values.startDate,
      phaseDays,
      targetTempC: values.targetTempC ?? null,
      notes: values.notes?.trim() ?? '',
    })
    setSelectedId(plan.id)
    toast(t('brumation.created'), 'success')
    form.reset({
      startDate: today,
      vetCheck: defaultDaysFor('vetCheck'),
      fasting: defaultDaysFor('fasting'),
      coolDown: defaultDaysFor('coolDown'),
      dormancy: defaultDaysFor('dormancy'),
      warmUp: defaultDaysFor('warmUp'),
      recovery: defaultDaysFor('recovery'),
      targetTempC: null,
      notes: '',
    })
  })

  function handleRemove(id: string) {
    removePlan(id)
    if (selectedId === id) setSelectedId(null)
  }

  const phaseError = (id: BrumationPhaseId) => {
    const msg = form.formState.errors[id]?.message
    return msg ? t(msg) : undefined
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('brumation.title')}</h1>
        <p className={styles.subtitle}>{t('brumation.subtitle')}</p>
        {activeSpecies && (
          <span className={styles.speciesChip}>
            <span aria-hidden="true">{activeSpecies.heroEmoji}</span> {activeSpecies.koreanName}
          </span>
        )}
      </header>

      {/* ── Safety-first warning ──────────────────────────────── */}
      <Alert variant="warning" title={t('brumation.safety.title')}>
        <p>{t('brumation.safety.intro')}</p>
        <ul className={styles.safetyList}>
          {SAFETY_NOTES.map((id) => (
            <li key={id}>{t(`brumation.safety.${id}`)}</li>
          ))}
        </ul>
      </Alert>

      {!isReptile && (
        <Alert variant="info" title={t('brumation.notReptile.title')}>
          {t('brumation.notReptile.desc')}
        </Alert>
      )}

      {/* ── Active plan timeline ──────────────────────────────── */}
      {selectedPlan && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('brumation.active.title')}</h2>
          <ActivePlanView
            plan={selectedPlan}
            today={today}
            species={speciesLabel(selectedPlan.speciesId)}
          />
        </div>
      )}

      {/* ── Create a plan ─────────────────────────────────────── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('brumation.form.title')}</h2>
        <p className={styles.sectionIntro}>{t('brumation.form.intro')}</p>

        <Card padding="lg">
          <Card.Body>
            <h3 className={styles.formTitle}>{t('brumation.form.newTitle')}</h3>
            <form onSubmit={onCreate} className={styles.form} noValidate>
              <div className={styles.formRow}>
                <Input
                  type="date"
                  label={t('brumation.form.startDate')}
                  error={
                    form.formState.errors.startDate?.message
                      ? t(form.formState.errors.startDate.message)
                      : undefined
                  }
                  {...form.register('startDate')}
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  label={t('brumation.form.targetTemp')}
                  helperText={t('brumation.form.targetTempHelper')}
                  error={
                    form.formState.errors.targetTempC?.message
                      ? t(form.formState.errors.targetTempC.message)
                      : undefined
                  }
                  {...form.register('targetTempC', { setValueAs: numberSetter })}
                />
              </div>

              <fieldset className={styles.form}>
                <legend className={styles.fieldsetLegend}>
                  {t('brumation.form.phasesLegend')}
                </legend>
                <div className={styles.phaseGrid}>
                  {BRUMATION_PHASES.map((phase) => (
                    <Input
                      key={phase.id}
                      type="number"
                      inputMode="numeric"
                      step="1"
                      min="1"
                      label={t(`brumation.phases.${phase.id}.title`)}
                      helperText={t('brumation.form.daysUnit')}
                      error={phaseError(phase.id)}
                      {...form.register(phase.id, { valueAsNumber: true })}
                    />
                  ))}
                </div>
              </fieldset>

              <Textarea
                label={t('brumation.form.notes')}
                rows={2}
                helperText={t('brumation.form.notesOptional')}
                error={
                  form.formState.errors.notes?.message
                    ? t(form.formState.errors.notes.message)
                    : undefined
                }
                {...form.register('notes')}
              />
              <div className={styles.formActions}>
                <Button type="submit" variant="primary" isLoading={form.formState.isSubmitting}>
                  {t('brumation.form.add')}
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </div>

      {/* ── Saved plans ───────────────────────────────────────── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('brumation.list.title')}</h2>
        {plans.length === 0 ? (
          <EmptyState
            icon="❄️"
            title={t('brumation.list.emptyTitle')}
            description={t('brumation.list.emptyDesc')}
            headingLevel={3}
          />
        ) : (
          <ul className={styles.planList}>
            {plans.map((plan) => {
              const sp = speciesLabel(plan.speciesId)
              const isSelected = selectedPlan?.id === plan.id
              return (
                <li key={plan.id}>
                  <Card padding="md">
                    <Card.Body>
                      <div className={styles.planHeader}>
                        <div>
                          <div className={styles.summarySpecies}>
                            <span aria-hidden="true">{sp.emoji}</span> {sp.name}
                            {isSelected && (
                              <span className={styles.activeTag}>
                                {t('brumation.list.viewing')}
                              </span>
                            )}
                          </div>
                          <div className={styles.planMeta}>
                            <span>
                              {t('brumation.list.starts')} {plan.startDate}
                            </span>
                            <span>·</span>
                            <span>{t('brumation.list.totalDays', { count: totalDays(plan) })}</span>
                          </div>
                        </div>
                        <div className={styles.planActions}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedId(plan.id)}
                          >
                            {t('brumation.list.load')}
                          </Button>
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => handleRemove(plan.id)}
                          >
                            {t('brumation.remove')}
                          </button>
                        </div>
                      </div>
                      {plan.notes.trim() && <p className={styles.planNotes}>{plan.notes}</p>}
                    </Card.Body>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
        <p className={styles.disclaimer}>{t('brumation.disclaimer')}</p>
      </div>
    </section>
  )
}

interface ActivePlanViewProps {
  plan: BrumationPlan
  today: string
  species: { name: string; emoji: string }
}

function ActivePlanView({ plan, today, species }: ActivePlanViewProps) {
  const { t } = useTranslation()
  const schedule = phaseSchedule(plan)
  const active = currentPhase(plan, today)
  const progress = progressPct(plan, today)
  const planEnd = endDate(plan)
  const total = totalDays(plan)

  const ddays = daysUntil(planEnd, today)
  const started = daysUntil(plan.startDate, today) <= 0
  const ddayLabel =
    ddays > 0 ? `D-${ddays}` : ddays === 0 ? t('brumation.dday.today') : `D+${Math.abs(ddays)}`

  // Index of the active phase, used to tint past/current/future timeline dots.
  const activeIndex = active
    ? schedule.findIndex((s) => s.id === active)
    : started
      ? schedule.length
      : -1

  return (
    <Card padding="lg">
      <Card.Body>
        <div className={styles.summaryTop}>
          <span className={styles.summarySpecies}>
            <span aria-hidden="true">{species.emoji}</span> {species.name}
          </span>
          {active ? (
            <Badge variant="primary">{t(`brumation.phases.${active}.title`)}</Badge>
          ) : started ? (
            <Badge variant="success">{t('brumation.status.done')}</Badge>
          ) : (
            <Badge variant="default">{t('brumation.status.upcoming')}</Badge>
          )}
        </div>

        <div className={styles.statBlock}>
          <span className={styles.dday}>{ddayLabel}</span>{' '}
          <span className={styles.ddaySub}>{t('brumation.dday.sub')}</span>
        </div>

        <div className={styles.statBlock}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>{t('brumation.active.period')}</span>
            <span className={styles.statValue}>
              {plan.startDate} ~ {planEnd}
            </span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>{t('brumation.active.length')}</span>
            <span className={styles.statValue}>
              {t('brumation.list.totalDays', { count: total })}
            </span>
          </div>
          {plan.targetTempC !== null && (
            <div className={styles.statRow}>
              <span className={styles.statLabel}>{t('brumation.active.targetTemp')}</span>
              <span className={styles.statValue}>{plan.targetTempC}°C</span>
            </div>
          )}
        </div>

        <div className={styles.progressWrap}>
          <Progress
            value={progress}
            variant={active ? 'primary' : started ? 'success' : 'primary'}
            size="sm"
          />
          <span className={styles.ddaySub}>
            {t('brumation.active.progressLabel', { pct: Math.round(progress) })}
          </span>
        </div>

        <ol className={styles.timeline}>
          {schedule.map((seg, i) => {
            const isCurrent = seg.id === active
            const isPast = activeIndex >= 0 && i < activeIndex
            const dotClass = [
              styles.timelineDot,
              isCurrent ? styles.timelineDotCurrent : isPast ? styles.timelineDotPast : '',
            ]
              .filter(Boolean)
              .join(' ')
            const lineClass = [styles.timelineLine, isPast ? styles.timelineLinePast : '']
              .filter(Boolean)
              .join(' ')
            return (
              <li key={seg.id} className={styles.timelineItem}>
                <div className={styles.timelineRail}>
                  <span className={dotClass} aria-hidden="true" />
                  {i < schedule.length - 1 && <span className={lineClass} aria-hidden="true" />}
                </div>
                <div className={styles.timelineBody}>
                  <div className={styles.timelineHead}>
                    <span className={styles.timelineNum}>{i + 1}</span>
                    <span className={styles.timelineTitle}>
                      {t(`brumation.phases.${seg.id}.title`)}
                    </span>
                    {isCurrent && (
                      <Badge variant="primary">{t('brumation.timeline.current')}</Badge>
                    )}
                  </div>
                  <div className={styles.timelineDates}>
                    {seg.startDate} ~ {seg.endDate}{' '}
                    <span className={styles.timelineDuration}>
                      ({t('brumation.list.totalDays', { count: phaseDuration(plan, seg.id) })})
                    </span>
                  </div>
                  <p className={styles.timelineDesc}>{t(`brumation.phases.${seg.id}.desc`)}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </Card.Body>
    </Card>
  )
}

export default Brumation
