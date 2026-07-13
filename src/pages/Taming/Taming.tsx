import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpecies } from '@domains/species'
import {
  CALMNESS_LEVELS,
  STRESS_SIGNS,
  avgCalmness,
  calmnessTrend,
  handlingFormSchema,
  handlingGuidanceCode,
  latestSession,
  progressDelta,
  sortByDate,
  useActivePetSessions,
  useTamingStore,
  type HandlingFormValues,
  type StressSign,
} from '@domains/taming'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Taming.module.css'

function localTodayIso(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function numberSetter(value: unknown): number {
  if (value === '' || value === null || value === undefined) return Number.NaN
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function Taming() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('taming.title'))

  const profile = useOnboardingStore((state) => state.profile)
  const activePetId = useOnboardingStore((state) => state.activePetId)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)
  const sessions = useActivePetSessions()
  const addSession = useTamingStore((state) => state.addSession)
  const removeSession = useTamingStore((state) => state.removeSession)
  const today = localTodayIso()

  const sorted = useMemo(() => sortByDate(sessions), [sessions])
  const average = useMemo(() => avgCalmness(sessions), [sessions])
  const trend = useMemo(() => calmnessTrend(sessions), [sessions])
  const delta = useMemo(() => progressDelta(sessions), [sessions])
  const latest = useMemo(() => latestSession(sessions), [sessions])
  const guidance = useMemo(
    () => handlingGuidanceCode(species?.handlingTolerance, sessions),
    [sessions, species?.handlingTolerance]
  )
  const welfareConcern = guidance === 'highStress' || guidance === 'lowTolerance'

  const form = useForm<HandlingFormValues>({
    resolver: zodResolver(handlingFormSchema),
    defaultValues: {
      sessionAt: today,
      durationMin: 5,
      calmness: 3,
      stressSigns: [],
      note: '',
    },
  })
  const calmness = useWatch({ control: form.control, name: 'calmness' })
  const stressSigns = useWatch({ control: form.control, name: 'stressSigns' }) ?? []

  const onSubmit = form.handleSubmit((values) => {
    if (!activePetId) return
    addSession({
      petId: activePetId,
      speciesId: profile.speciesId,
      sessionAt: values.sessionAt,
      durationMin: values.durationMin,
      calmness: values.calmness,
      stressSigns: values.stressSigns,
      note: values.note.trim(),
    })
    toast(t('taming.saved'), 'success')
    form.reset({
      sessionAt: today,
      durationMin: 5,
      calmness: values.calmness,
      stressSigns: [],
      note: '',
    })
  })

  function toggleStressSign(sign: StressSign) {
    const next = stressSigns.includes(sign)
      ? stressSigns.filter((item) => item !== sign)
      : [...stressSigns, sign]
    form.setValue('stressSigns', next, { shouldDirty: true, shouldValidate: true })
  }

  function handleRemove(id: string) {
    if (!window.confirm(t('taming.removeConfirm'))) return
    removeSession(id)
    toast(t('taming.removed'), 'info')
  }

  if (!activePetId) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{t('taming.eyebrow')}</p>
          <h1>{t('taming.title')}</h1>
          <p className={styles.subtitle}>{t('taming.subtitle')}</p>
        </header>
        <Card padding="lg" className={styles.petGate}>
          <Card.Body>
            <span className={styles.gateIcon} aria-hidden="true">
              🐾
            </span>
            <h2>{t('taming.petRequiredTitle')}</h2>
            <p>{t('taming.petRequiredBody')}</p>
            <Link to="/onboarding" className={styles.primaryLink}>
              {t('taming.petRequiredAction')}
            </Link>
          </Card.Body>
        </Card>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('taming.eyebrow')}</p>
        <h1>{t('taming.title')}</h1>
        <p className={styles.subtitle}>{t('taming.subtitle')}</p>
        <div className={styles.petContext}>
          <span aria-hidden="true">{species?.heroEmoji ?? '🐾'}</span>
          <span>
            {t('taming.activePet', {
              name: profile.petName?.trim() || species?.koreanName || t('taming.aPet'),
            })}
          </span>
        </div>
      </header>

      <Alert variant={welfareConcern ? 'warning' : 'info'} title={t('taming.welfareTitle')}>
        {t(`taming.guidance.${guidance}`)}
      </Alert>

      <Card padding="lg">
        <Card.Body>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.sectionKicker}>{t('taming.form.kicker')}</p>
              <h2 className={styles.sectionTitle}>{t('taming.form.title')}</h2>
            </div>
            <span className={styles.privatePill}>{t('taming.privatePill')}</span>
          </div>

          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.formRow}>
              <Input
                type="date"
                max={today}
                label={t('taming.form.date')}
                error={
                  form.formState.errors.sessionAt?.message
                    ? t(form.formState.errors.sessionAt.message)
                    : undefined
                }
                {...form.register('sessionAt')}
              />
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                max="600"
                step="1"
                label={t('taming.form.duration')}
                helperText={t('taming.form.durationHelper')}
                error={
                  form.formState.errors.durationMin?.message
                    ? t(form.formState.errors.durationMin.message)
                    : undefined
                }
                {...form.register('durationMin', { setValueAs: numberSetter })}
              />
            </div>

            <fieldset className={styles.fieldset}>
              <legend>{t('taming.form.calmness')}</legend>
              <p className={styles.fieldHelp}>{t('taming.form.calmnessHelper')}</p>
              <div className={styles.segmentGroup}>
                {CALMNESS_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`${styles.segment} ${calmness === level ? styles.segmentActive : ''}`}
                    aria-pressed={calmness === level}
                    onClick={() =>
                      form.setValue('calmness', level, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <strong>{level}</strong>
                    <span>{t(`taming.calmness.${level}`)}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend>{t('taming.form.signs')}</legend>
              <p className={styles.fieldHelp}>{t('taming.form.signsHelper')}</p>
              <div className={styles.signGrid}>
                {STRESS_SIGNS.map((sign) => {
                  const selected = stressSigns.includes(sign)
                  return (
                    <button
                      key={sign}
                      type="button"
                      className={`${styles.signButton} ${selected ? styles.signButtonActive : ''}`}
                      aria-pressed={selected}
                      onClick={() => toggleStressSign(sign)}
                    >
                      {t(`taming.signs.${sign}`)}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <Textarea
              label={t('taming.form.note')}
              placeholder={t('taming.form.notePlaceholder')}
              rows={3}
              maxLength={200}
              helperText={t('taming.form.noteHelper')}
              error={
                form.formState.errors.note?.message
                  ? t(form.formState.errors.note.message)
                  : undefined
              }
              {...form.register('note')}
            />

            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={form.formState.isSubmitting}>
                {t('taming.form.submit')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {sessions.length > 0 && (
        <Card padding="lg" className={styles.insightCard}>
          <Card.Body>
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.sectionKicker}>{t('taming.stats.kicker')}</p>
                <h2 className={styles.sectionTitle}>{t('taming.stats.title')}</h2>
              </div>
              <Badge variant={welfareConcern ? 'warning' : 'default'}>
                {t(
                  `taming.trend.${delta === null ? 'notEnough' : delta > 0.2 ? 'up' : delta < -0.2 ? 'down' : 'steady'}`
                )}
              </Badge>
            </div>

            <dl className={styles.metrics}>
              <div>
                <dt>{t('taming.stats.total')}</dt>
                <dd>{sessions.length}</dd>
              </div>
              <div>
                <dt>{t('taming.stats.average')}</dt>
                <dd>{average === null ? '—' : `${average}/5`}</dd>
              </div>
              <div>
                <dt>{t('taming.stats.latest')}</dt>
                <dd>{latest ? `${latest.calmness}/5` : '—'}</dd>
              </div>
            </dl>

            <div className={styles.trendWrap}>
              <div className={styles.trendHead}>
                <span>{t('taming.stats.trend')}</span>
                <span>{t('taming.stats.trendRange')}</span>
              </div>
              <div
                className={styles.trendPlot}
                role="img"
                aria-label={t('taming.stats.trendAria', { count: trend.length })}
              >
                {trend.map((value, index) => (
                  <span
                    key={`${index}-${value}`}
                    className={styles.trendBar}
                    style={{ height: `${value * 20}%` }}
                    title={`${value}/5`}
                  />
                ))}
              </div>
              <p className={styles.subjectiveNote}>{t('taming.subjectiveNote')}</p>
            </div>
          </Card.Body>
        </Card>
      )}

      <section aria-labelledby="taming-history-title">
        <div className={styles.historyHead}>
          <h2 id="taming-history-title" className={styles.sectionTitle}>
            {t('taming.history.title')}
          </h2>
          {sessions.length > 0 && (
            <span className={styles.historyCount}>
              {t('taming.history.count', { count: sessions.length })}
            </span>
          )}
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            variant="log"
            icon="🤲"
            title={t('taming.history.emptyTitle')}
            description={t('taming.history.emptyDesc')}
            hint={t('taming.history.emptyHint')}
          />
        ) : (
          <ul className={styles.historyList}>
            {sorted.map((session) => (
              <li key={session.id}>
                <Card padding="md">
                  <Card.Body>
                    <div className={styles.entryHeader}>
                      <div className={styles.entryHeaderLeft}>
                        <Badge variant={session.calmness <= 2 ? 'warning' : 'default'}>
                          {t('taming.history.calmness', { value: session.calmness })}
                        </Badge>
                        <span className={styles.entryDate}>{session.sessionAt}</span>
                        <span className={styles.entryMeta}>
                          {t('taming.history.minutes', { count: session.durationMin })}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => handleRemove(session.id)}
                      >
                        {t('taming.remove')}
                      </button>
                    </div>
                    {session.stressSigns.length > 0 && (
                      <div className={styles.signChips}>
                        {session.stressSigns.map((sign) => (
                          <span key={sign} className={styles.signChip}>
                            {t(`taming.signs.${sign}`)}
                          </span>
                        ))}
                      </div>
                    )}
                    {session.note && <p className={styles.entryNote}>{session.note}</p>}
                  </Card.Body>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}

export default Taming
