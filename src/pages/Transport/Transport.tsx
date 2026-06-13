import Alert from '@components/common/Alert'
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
import { useSpeciesList } from '@domains/species'
import {
  categoryTip,
  checklistProgress,
  daysUntil,
  PURPOSES,
  sortTrips,
  TRANSPORT_CHECKLIST,
  tripFormSchema,
  tripStatusCode,
  useActivePetTrips,
  useTransportStore,
  type TripFormValues,
} from '@domains/transport'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Transport.module.css'

const todayISO = () => new Date().toISOString().slice(0, 10)

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'

const STATUS_VARIANT: Record<ReturnType<typeof tripStatusCode>, BadgeVariant> = {
  today: 'warning',
  upcoming: 'primary',
  past: 'default',
}

function Transport() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('transport.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const trips = useActivePetTrips()
  const addTrip = useTransportStore((s) => s.addTrip)
  const toggleChecklistItem = useTransportStore((s) => s.toggleChecklistItem)
  const removeTrip = useTransportStore((s) => s.removeTrip)

  const { data: speciesList = [] } = useSpeciesList({})
  const activeSpecies = useMemo(
    () => speciesList.find((s) => s.id === profile.speciesId) ?? null,
    [speciesList, profile.speciesId],
  )

  const today = todayISO()
  const sorted = useMemo(() => sortTrips(trips, today), [trips, today])
  const tipKey = useMemo(() => categoryTip(profile.category), [profile.category])
  const isRegulated = activeSpecies?.filingStatus === 'regulated'

  const numberSetter = (v: unknown) => {
    if (v === '' || v === null || v === undefined) return null
    const num = Number(v)
    return Number.isFinite(num) ? num : null
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: { purpose: 'vet', date: today, durationHours: null, notes: '' },
  })

  const onSubmit = handleSubmit((values) => {
    addTrip({
      speciesId: profile.speciesId,
      purpose: values.purpose,
      date: values.date,
      durationHours: values.durationHours,
      notes: values.notes,
    })
    toast(t('transport.created'), 'success')
    reset({ purpose: values.purpose, date: today, durationHours: null, notes: '' })
  })

  const purposeOptions = PURPOSES.map((p) => ({ value: p, label: t(`transport.purposes.${p}`) }))

  function dDayLabel(date: string): string {
    const delta = daysUntil(date, today)
    if (delta === 0) return t('transport.dday.today')
    if (delta > 0) return t('transport.dday.in', { count: delta })
    return t('transport.dday.ago', { count: Math.abs(delta) })
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('transport.title')}</h1>
        <p className={styles.subtitle}>{t('transport.subtitle')}</p>
      </header>

      <Card padding="md" className={styles.tipCard}>
        <Card.Body className={styles.tipBody}>
          <span className={styles.tipIcon} aria-hidden="true">
            🌡️
          </span>
          <div>
            <p className={styles.tipLabel}>{t('transport.tipLabel')}</p>
            <p className={styles.tipText}>{t(tipKey)}</p>
          </div>
        </Card.Body>
      </Card>

      {isRegulated && (
        <Alert variant="warning" title={t('transport.paperwork.title')}>
          <p className={styles.paperworkText}>
            {t('transport.paperwork.desc', { name: activeSpecies?.koreanName ?? '' })}
          </p>
          <Link to="/registry" className={styles.paperworkLink}>
            {t('transport.paperwork.link')}
          </Link>
        </Alert>
      )}

      <section aria-labelledby="transport-new" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 id="transport-new" className={styles.sectionTitle}>
            {t('transport.form.title')}
          </h2>
          <p className={styles.sectionIntro}>{t('transport.form.intro')}</p>
        </header>

        <Card padding="lg">
          <Card.Body>
            <form onSubmit={onSubmit} className={styles.form} noValidate>
              <div className={styles.formRow}>
                <Select
                  label={t('transport.form.purpose')}
                  options={purposeOptions}
                  {...register('purpose')}
                />
                <Input
                  type="date"
                  label={t('transport.form.date')}
                  error={errors.date?.message ? t(errors.date.message) : undefined}
                  {...register('date')}
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  label={t('transport.form.duration')}
                  helperText={t('transport.form.durationHelper')}
                  error={
                    errors.durationHours?.message ? t(errors.durationHours.message) : undefined
                  }
                  {...register('durationHours', { setValueAs: numberSetter })}
                />
              </div>
              <Textarea
                label={t('transport.form.notes')}
                placeholder={t('transport.form.notesPlaceholder')}
                rows={3}
                maxLength={300}
                error={errors.notes?.message ? t(errors.notes.message) : undefined}
                {...register('notes')}
              />
              <div className={styles.formActions}>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  {t('transport.form.submit')}
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </section>

      <section aria-labelledby="transport-list" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 id="transport-list" className={styles.sectionTitle}>
            {t('transport.list.title')}
          </h2>
          <p className={styles.sectionIntro}>{t('transport.list.intro')}</p>
        </header>

        {sorted.length === 0 ? (
          <EmptyState
            icon="🧳"
            title={t('transport.empty.title')}
            description={t('transport.empty.desc')}
          />
        ) : (
          <ul className={styles.tripList}>
            {sorted.map((trip) => {
              const status = tripStatusCode(trip, today)
              const prog = checklistProgress(trip, TRANSPORT_CHECKLIST)
              const progVariant =
                prog.pct === 100 ? 'success' : prog.pct >= 50 ? 'primary' : 'warning'
              return (
                <li key={trip.id}>
                  <Card padding="lg" className={styles.tripCard}>
                    <Card.Body>
                      <div className={styles.tripTop}>
                        <div className={styles.tripBadges}>
                          <Badge variant="primary">{t(`transport.purposes.${trip.purpose}`)}</Badge>
                          <Badge variant={STATUS_VARIANT[status]}>{dDayLabel(trip.date)}</Badge>
                        </div>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => removeTrip(trip.id)}
                        >
                          {t('transport.list.remove')}
                        </button>
                      </div>

                      <dl className={styles.tripMeta}>
                        <div className={styles.metaItem}>
                          <dt>{t('transport.list.dateLabel')}</dt>
                          <dd>{trip.date}</dd>
                        </div>
                        {trip.durationHours !== null && (
                          <div className={styles.metaItem}>
                            <dt>{t('transport.list.durationLabel')}</dt>
                            <dd>
                              {t('transport.list.durationValue', { hours: trip.durationHours })}
                            </dd>
                          </div>
                        )}
                      </dl>

                      {trip.notes && <p className={styles.tripNotes}>{trip.notes}</p>}

                      <div className={styles.progressBlock}>
                        <div className={styles.progressTop}>
                          <span className={styles.progressLabel}>
                            {t('transport.checklist.title')}
                          </span>
                          <Badge variant={prog.pct === 100 ? 'success' : 'default'}>
                            {t('transport.checklist.count', { done: prog.done, total: prog.total })}
                          </Badge>
                        </div>
                        <Progress
                          value={prog.pct}
                          variant={progVariant}
                          size="sm"
                          label={t('transport.checklist.aria', { pct: prog.pct })}
                        />
                      </div>

                      <ul className={styles.itemList}>
                        {TRANSPORT_CHECKLIST.map((itemId) => {
                          const isChecked = Boolean(trip.checklist[itemId])
                          return (
                            <li
                              key={itemId}
                              className={`${styles.item} ${isChecked ? styles.itemChecked : ''}`}
                            >
                              <Switch
                                checked={isChecked}
                                onChange={() => toggleChecklistItem(trip.id, itemId)}
                                label={t(`transport.items.${itemId}`)}
                              />
                            </li>
                          )
                        })}
                      </ul>

                      <p className={styles.tripTip}>
                        <span aria-hidden="true">🌡️</span> {t(tipKey)}
                      </p>

                      {isRegulated && (
                        <p className={styles.tripPaperwork}>
                          <span aria-hidden="true">📄</span> {t('transport.list.paperworkHint')}{' '}
                          <Link to="/registry" className={styles.inlineLink}>
                            {t('transport.paperwork.link')}
                          </Link>
                        </p>
                      )}
                    </Card.Body>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <p className={styles.disclaimer}>{t('transport.disclaimer')}</p>
    </section>
  )
}

export default Transport
