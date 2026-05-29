import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Progress from '@components/common/Progress'
import Select from '@components/common/Select'
import Tabs from '@components/common/Tabs'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  courseProgress,
  doseStatusCode,
  givenDoses,
  isDoseGiven,
  medicationFormSchema,
  nextDoseDate,
  QUARANTINE_DEFAULT_DURATION,
  QUARANTINE_DURATION_PRESETS,
  QUARANTINE_REASONS,
  quarantineDaysRemaining,
  quarantineDoneCode,
  quarantineEndDate,
  quarantineFormSchema,
  quarantineProgress,
  useActivePetMeds,
  useActivePetQuarantines,
  useMedsStore,
  type DoseStatusCode,
  type Medication,
  type MedicationFormValues,
  type Quarantine,
  type QuarantineFormValues,
} from '@features/meds'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Meds.module.css'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const DOSE_STATUS_VARIANT: Record<DoseStatusCode, 'warning' | 'error' | 'primary' | 'success'> = {
  dueToday: 'warning',
  overdue: 'error',
  upcoming: 'primary',
  done: 'success',
}

/** Signed day count → a short Korean D-day label, e.g. D-3 / D-DAY / D+2. */
function dDayLabel(days: number): string {
  if (days === 0) return 'D-DAY'
  if (days > 0) return `D-${days}`
  return `D+${Math.abs(days)}`
}

function daysFromTodayTo(dateISO: string): number {
  const start = new Date(`${todayIso()}T00:00:00Z`).getTime()
  const target = new Date(`${dateISO.slice(0, 10)}T00:00:00Z`).getTime()
  return Math.round((target - start) / 86_400_000)
}

/* ------------------------------------------------------------------ */
/* Medication tab                                                      */
/* ------------------------------------------------------------------ */

function MedicationForm() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const addMedication = useMedsStore((s) => s.addMedication)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      name: '',
      reason: '',
      dosage: '',
      startedAt: todayIso(),
      frequencyDays: 1,
      durationDays: null,
      notes: '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    addMedication({
      name: values.name,
      reason: values.reason,
      dosage: values.dosage,
      startedAt: values.startedAt,
      frequencyDays: values.frequencyDays,
      durationDays: values.durationDays ?? null,
      notes: values.notes,
    })
    toast(t('meds.med.added'), 'success')
    reset({
      name: '',
      reason: '',
      dosage: '',
      startedAt: todayIso(),
      frequencyDays: values.frequencyDays,
      durationDays: null,
      notes: '',
    })
  })

  const toNullableInt = (v: unknown) => {
    if (v === '' || v === null || v === undefined) return null
    const num = Number(v)
    return Number.isFinite(num) ? num : null
  }

  return (
    <Card padding="lg">
      <Card.Body>
        <h2 className={styles.formTitle}>{t('meds.med.newTitle')}</h2>
        <form onSubmit={onSubmit} className={styles.form} noValidate>
          <div className={styles.formRow}>
            <Input
              label={t('meds.med.name')}
              placeholder={t('meds.med.namePlaceholder')}
              error={errors.name?.message ? t(errors.name.message) : undefined}
              {...register('name')}
            />
            <Input
              label={t('meds.med.dosage')}
              placeholder={t('meds.med.dosagePlaceholder')}
              error={errors.dosage?.message ? t(errors.dosage.message) : undefined}
              {...register('dosage')}
            />
          </div>
          <Input
            label={t('meds.med.reason')}
            placeholder={t('meds.med.reasonPlaceholder')}
            error={errors.reason?.message ? t(errors.reason.message) : undefined}
            {...register('reason')}
          />
          <div className={styles.formRow}>
            <Input
              type="date"
              label={t('meds.med.startedAt')}
              error={errors.startedAt?.message ? t(errors.startedAt.message) : undefined}
              {...register('startedAt')}
            />
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              label={t('meds.med.frequency')}
              helperText={t('meds.med.frequencyHelper')}
              error={errors.frequencyDays?.message ? t(errors.frequencyDays.message) : undefined}
              {...register('frequencyDays', { setValueAs: (v) => toNullableInt(v) ?? 1 })}
            />
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              label={t('meds.med.duration')}
              helperText={t('meds.med.durationHelper')}
              error={errors.durationDays?.message ? t(errors.durationDays.message) : undefined}
              {...register('durationDays', { setValueAs: toNullableInt })}
            />
          </div>
          <Textarea
            label={t('meds.med.notes')}
            rows={2}
            placeholder={t('meds.med.notesPlaceholder')}
            error={errors.notes?.message ? t(errors.notes.message) : undefined}
            {...register('notes')}
          />
          <div className={styles.formActions}>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t('meds.med.add')}
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}

function MedicationCard({ med }: { med: Medication }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const markDose = useMedsStore((s) => s.markDose)
  const removeMedication = useMedsStore((s) => s.removeMedication)

  const today = todayIso()
  const status = doseStatusCode(med, today)
  const next = nextDoseDate(med, today)
  const nextDelta = next ? daysFromTodayTo(next) : null
  const progress = courseProgress(med, today)
  const givenToday = isDoseGiven(med, today)
  const recent = givenDoses(med).slice(0, 4)

  const handleMarkToday = () => {
    markDose(med.id, today, !givenToday)
    toast(givenToday ? t('meds.med.doseUndone') : t('meds.med.doseDone'), 'success')
  }

  return (
    <Card padding="md">
      <Card.Body>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderMain}>
            <h3 className={styles.cardTitle}>{med.name}</h3>
            {med.dosage && <span className={styles.cardMeta}>{med.dosage}</span>}
          </div>
          <Badge variant={DOSE_STATUS_VARIANT[status]}>
            {status === 'done'
              ? t('meds.status.done')
              : `${t(`meds.status.${status}`)} · ${dDayLabel(nextDelta ?? 0)}`}
          </Badge>
        </div>

        {med.reason && <p className={styles.cardReason}>{med.reason}</p>}

        <dl className={styles.metaGrid}>
          <div>
            <dt>{t('meds.med.frequencyLabel')}</dt>
            <dd>{t('meds.med.everyNDays', { count: med.frequencyDays })}</dd>
          </div>
          <div>
            <dt>{t('meds.med.startedAt')}</dt>
            <dd>{med.startedAt}</dd>
          </div>
          <div>
            <dt>{t('meds.med.nextDose')}</dt>
            <dd>{next ?? t('meds.med.courseComplete')}</dd>
          </div>
        </dl>

        {med.durationDays !== null && (
          <div className={styles.progressBlock}>
            <div className={styles.progressLabel}>
              <span>{t('meds.med.courseProgress')}</span>
              <span>{t('meds.med.ofNDays', { count: med.durationDays })}</span>
            </div>
            <Progress value={progress} variant={status === 'done' ? 'success' : 'primary'} />
          </div>
        )}

        {recent.length > 0 && (
          <div className={styles.history}>
            <span className={styles.historyTitle}>{t('meds.med.recentDoses')}</span>
            <ul className={styles.historyList}>
              {recent.map((date) => (
                <li key={date}>
                  <Badge variant="success">✓ {date}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        {med.notes && <p className={styles.cardNotes}>{med.notes}</p>}

        <div className={styles.cardActions}>
          <Button
            type="button"
            variant={givenToday ? 'outline' : 'primary'}
            size="sm"
            onClick={handleMarkToday}
            disabled={status === 'done' && !givenToday}
          >
            {givenToday ? t('meds.med.markedToday') : t('meds.med.markToday')}
          </Button>
          <button
            type="button"
            className={styles.removeButton}
            onClick={() => removeMedication(med.id)}
          >
            {t('meds.remove')}
          </button>
        </div>
      </Card.Body>
    </Card>
  )
}

function MedicationsTab() {
  const { t } = useTranslation()
  const medications = useActivePetMeds()

  return (
    <div className={styles.tabContent}>
      <Alert variant="warning" title={t('meds.disclaimer.title')}>
        {t('meds.disclaimer.body')}
      </Alert>
      <MedicationForm />
      {medications.length === 0 ? (
        <EmptyState
          icon="💊"
          title={t('meds.med.emptyTitle')}
          description={t('meds.med.emptyDesc')}
        />
      ) : (
        <ul className={styles.list}>
          {medications.map((med) => (
            <li key={med.id}>
              <MedicationCard med={med} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Quarantine tab                                                      */
/* ------------------------------------------------------------------ */

function QuarantineForm() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const addQuarantine = useMedsStore((s) => s.addQuarantine)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuarantineFormValues>({
    resolver: zodResolver(quarantineFormSchema),
    defaultValues: {
      animalName: '',
      startedAt: todayIso(),
      durationDays: QUARANTINE_DEFAULT_DURATION,
      reasonCode: 'newArrival',
      notes: '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    addQuarantine({
      animalName: values.animalName,
      startedAt: values.startedAt,
      durationDays: values.durationDays,
      reasonCode: values.reasonCode,
      notes: values.notes,
    })
    toast(t('meds.quarantine.added'), 'success')
    reset({
      animalName: '',
      startedAt: todayIso(),
      durationDays: values.durationDays,
      reasonCode: values.reasonCode,
      notes: '',
    })
  })

  return (
    <Card padding="lg">
      <Card.Body>
        <h2 className={styles.formTitle}>{t('meds.quarantine.newTitle')}</h2>
        <form onSubmit={onSubmit} className={styles.form} noValidate>
          <Input
            label={t('meds.quarantine.animalName')}
            placeholder={t('meds.quarantine.animalNamePlaceholder')}
            error={errors.animalName?.message ? t(errors.animalName.message) : undefined}
            {...register('animalName')}
          />
          <div className={styles.formRow}>
            <Input
              type="date"
              label={t('meds.quarantine.startedAt')}
              error={errors.startedAt?.message ? t(errors.startedAt.message) : undefined}
              {...register('startedAt')}
            />
            <Select
              label={t('meds.quarantine.reason')}
              options={QUARANTINE_REASONS.map((r) => ({
                value: r,
                label: t(`meds.quarantine.reasons.${r}`),
              }))}
              {...register('reasonCode')}
            />
          </div>
          <div>
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              max="180"
              step="1"
              label={t('meds.quarantine.duration')}
              helperText={t('meds.quarantine.durationHelper')}
              error={errors.durationDays?.message ? t(errors.durationDays.message) : undefined}
              {...register('durationDays', {
                setValueAs: (v) => {
                  const num = Number(v)
                  return Number.isFinite(num) ? num : QUARANTINE_DEFAULT_DURATION
                },
              })}
            />
            <div className={styles.presets}>
              {QUARANTINE_DURATION_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setValue('durationDays', preset, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                >
                  {t('meds.quarantine.presetDays', { count: preset })}
                </Button>
              ))}
            </div>
          </div>
          <Textarea
            label={t('meds.quarantine.notes')}
            rows={2}
            placeholder={t('meds.quarantine.notesPlaceholder')}
            error={errors.notes?.message ? t(errors.notes.message) : undefined}
            {...register('notes')}
          />
          <div className={styles.formActions}>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t('meds.quarantine.add')}
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}

const QUARANTINE_REASON_VARIANT: Record<Quarantine['reasonCode'], 'primary' | 'warning' | 'error'> =
  {
    newArrival: 'primary',
    illness: 'error',
    postVet: 'warning',
    other: 'primary',
  }

function QuarantineCard({ q }: { q: Quarantine }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const clearQuarantine = useMedsStore((s) => s.clearQuarantine)
  const removeQuarantine = useMedsStore((s) => s.removeQuarantine)

  const today = todayIso()
  const code = quarantineDoneCode(q, today)
  const remaining = quarantineDaysRemaining(q, today)
  const progress = code === 'cleared' ? 100 : quarantineProgress(q, today)
  const endDate = quarantineEndDate(q)

  const handleClear = () => {
    clearQuarantine(q.id)
    toast(t('meds.quarantine.cleared'), 'success')
  }

  return (
    <Card padding="md">
      <Card.Body>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderMain}>
            <h3 className={styles.cardTitle}>{q.animalName}</h3>
            <Badge variant={QUARANTINE_REASON_VARIANT[q.reasonCode]}>
              {t(`meds.quarantine.reasons.${q.reasonCode}`)}
            </Badge>
          </div>
          {code === 'cleared' ? (
            <Badge variant="success">{t('meds.quarantine.statusCleared')}</Badge>
          ) : code === 'readyToClear' ? (
            <Badge variant="warning">{t('meds.quarantine.statusReady')}</Badge>
          ) : (
            <Badge variant="primary">{t('meds.quarantine.dDay', { count: remaining })}</Badge>
          )}
        </div>

        <dl className={styles.metaGrid}>
          <div>
            <dt>{t('meds.quarantine.startedAt')}</dt>
            <dd>{q.startedAt}</dd>
          </div>
          <div>
            <dt>{t('meds.quarantine.endsAt')}</dt>
            <dd>{endDate}</dd>
          </div>
          <div>
            <dt>{t('meds.quarantine.remaining')}</dt>
            <dd>
              {code === 'cleared'
                ? t('meds.quarantine.clearedOn', { date: q.clearedAt ?? '' })
                : t('meds.quarantine.daysLeft', { count: remaining })}
            </dd>
          </div>
        </dl>

        <div className={styles.progressBlock}>
          <Progress
            value={progress}
            variant={
              code === 'active' ? 'primary' : code === 'readyToClear' ? 'warning' : 'success'
            }
          />
        </div>

        {q.notes && <p className={styles.cardNotes}>{q.notes}</p>}

        <div className={styles.cardActions}>
          {code !== 'cleared' && (
            <Button
              type="button"
              variant={code === 'readyToClear' ? 'primary' : 'outline'}
              size="sm"
              onClick={handleClear}
            >
              {t('meds.quarantine.clear')}
            </Button>
          )}
          <button
            type="button"
            className={styles.removeButton}
            onClick={() => removeQuarantine(q.id)}
          >
            {t('meds.remove')}
          </button>
        </div>
      </Card.Body>
    </Card>
  )
}

function QuarantineTab() {
  const { t } = useTranslation()
  const quarantines = useActivePetQuarantines()

  return (
    <div className={styles.tabContent}>
      <Alert variant="info" title={t('meds.quarantine.guideTitle')}>
        {t('meds.quarantine.guideBody')}
      </Alert>
      <QuarantineForm />
      {quarantines.length === 0 ? (
        <EmptyState
          icon="🧫"
          title={t('meds.quarantine.emptyTitle')}
          description={t('meds.quarantine.emptyDesc')}
        />
      ) : (
        <ul className={styles.list}>
          {quarantines.map((q) => (
            <li key={q.id}>
              <QuarantineCard q={q} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function Meds() {
  const { t } = useTranslation()
  useDocumentTitle(t('meds.title'))

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('meds.title')}</h1>
        <p className={styles.subtitle}>{t('meds.subtitle')}</p>
      </header>

      <Tabs
        tabs={[
          { id: 'medications', label: t('meds.tabs.medications'), content: <MedicationsTab /> },
          { id: 'quarantine', label: t('meds.tabs.quarantine'), content: <QuarantineTab /> },
        ]}
      />
    </section>
  )
}

export default Meds
