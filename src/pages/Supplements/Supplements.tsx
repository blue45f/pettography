import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import { useOnboardingStore } from '@features/onboarding'
import { useSpecies, useSpeciesList } from '@features/species'
import {
  categoryDusts,
  defaultIntervalDays,
  dustingFormSchema,
  dustingStats,
  dustingStatus,
  latestByType,
  nextDusting,
  SUPPLEMENT_TYPES,
  supplementGuidance,
  useActivePetDustings,
  useSupplementsStore,
  type DustingFormValues,
  type DustingLog,
  type DustingStatusCode,
  type SupplementType,
} from '@features/supplements'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Supplements.module.css'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_VARIANT: Record<DustingStatusCode, 'warning' | 'primary' | 'success' | 'default'> = {
  due: 'warning',
  soon: 'primary',
  ok: 'success',
  never: 'default',
}

/** Signed day count → a short D-day label, e.g. D-3 / D-DAY / D+2. */
function dDayLabel(days: number): string {
  if (days === 0) return 'D-DAY'
  if (days > 0) return `D-${days}`
  return `D+${Math.abs(days)}`
}

const TYPE_EMOJI: Record<SupplementType, string> = {
  calcium: '🦴',
  calciumD3: '☀️',
  multivitamin: '💊',
}

function Supplements() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('supplements.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const pets = useOnboardingStore((s) => s.pets)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)
  const { data: speciesList = [] } = useSpeciesList({})

  const activeLogs = useActivePetDustings()
  const allLogs = useSupplementsStore((s) => s.logs)
  const schedule = useSupplementsStore((s) => s.schedule)
  const addLog = useSupplementsStore((s) => s.addLog)
  const removeLog = useSupplementsStore((s) => s.removeLog)

  const [showAllPets, setShowAllPets] = useState(false)
  const logs = showAllPets ? allLogs : activeLogs
  const showPetBadge = showAllPets && pets.length > 1

  const category = profile.category
  const today = todayIso()
  const dusts = categoryDusts(category)

  const stats = useMemo(() => dustingStats(logs), [logs])

  // Effective interval per type: a custom override wins over the category default.
  const rows = useMemo(
    () =>
      SUPPLEMENT_TYPES.map((type) => {
        const last = latestByType(logs, type)
        const interval = schedule[type] ?? defaultIntervalDays(category, type)
        const status = dustingStatus(last?.dustedAt, interval ?? 0, today)
        const due = last ? nextDusting(last.dustedAt, interval ?? 0) : null
        const delta = due
          ? Math.round(
              (new Date(`${due}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) /
                86_400_000,
            )
          : null
        return { type, last, interval, status, due, delta }
      }),
    [logs, schedule, category, today],
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DustingFormValues>({
    resolver: zodResolver(dustingFormSchema),
    defaultValues: { type: 'calcium', dustedAt: today, note: '' },
  })

  const onSubmit = handleSubmit((values) => {
    addLog({
      speciesId: profile.speciesId,
      type: values.type,
      dustedAt: values.dustedAt,
      note: values.note.trim(),
    })
    toast(t('supplements.logged'), 'success')
    reset({ type: values.type, dustedAt: today, note: '' })
  })

  /** Quick one-tap log for today, used by the per-type buttons. */
  function quickLog(type: SupplementType) {
    addLog({ speciesId: profile.speciesId, type, dustedAt: today, note: '' })
    toast(t('supplements.quickLogged', { type: t(`supplements.types.${type}`) }), 'success')
  }

  function petLabel(petId: string | null | undefined): { name: string; emoji: string } | null {
    if (!petId) return null
    const pet = pets.find((p) => p.id === petId)
    if (!pet) return null
    const sp = speciesList.find((s) => s.id === pet.speciesId)
    return {
      name: pet.petName?.trim() || sp?.koreanName || t('supplements.aPet'),
      emoji: sp?.heroEmoji ?? '🐾',
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('supplements.title')}</h1>
        <p className={styles.subtitle}>{t('supplements.subtitle')}</p>
        {species && (
          <p className={styles.speciesNote}>
            <span aria-hidden="true">{species.heroEmoji}</span> {species.koreanName}
          </p>
        )}
        {pets.length > 1 && (
          <label className={styles.showAllToggle}>
            <input
              type="checkbox"
              checked={showAllPets}
              onChange={(e) => setShowAllPets(e.target.checked)}
            />
            {t('supplements.showAllPets')}
          </label>
        )}
      </header>

      <Alert variant="warning" title={t('supplements.mbd.title')}>
        {t('supplements.mbd.body')}
      </Alert>

      <Card padding="lg" className={styles.guidanceCard}>
        <Card.Body>
          <h2 className={styles.sectionTitle}>{t('supplements.guidanceTitle')}</h2>
          <p className={styles.guidanceText}>{t(supplementGuidance(category))}</p>
          <p className={styles.guidanceHint}>{t('supplements.uvbHint')}</p>
        </Card.Body>
      </Card>

      {!dusts && (
        <Alert variant="info" title={t('supplements.gutLoad.title')}>
          {t('supplements.gutLoad.body')}
        </Alert>
      )}

      <Card padding="lg" className={styles.statsCard}>
        <Card.Body>
          <h2 className={styles.sectionTitle}>{t('supplements.stats.title')}</h2>
          <dl className={styles.statsGrid}>
            <div>
              <dt>{t('supplements.stats.total')}</dt>
              <dd>{stats.total}</dd>
            </div>
            <div>
              <dt>{t('supplements.stats.lastDusted')}</dt>
              <dd>{stats.lastDusted ?? t('supplements.stats.never')}</dd>
            </div>
            <div>
              <dt>{t('supplements.types.calcium')}</dt>
              <dd>{stats.byType.calcium}</dd>
            </div>
            <div>
              <dt>{t('supplements.types.multivitamin')}</dt>
              <dd>{stats.byType.multivitamin}</dd>
            </div>
          </dl>
        </Card.Body>
      </Card>

      <section className={styles.statusSection} aria-label={t('supplements.scheduleTitle')}>
        <h2 className={styles.sectionTitle}>{t('supplements.scheduleTitle')}</h2>
        <ul className={styles.statusList}>
          {rows.map(({ type, last, interval, status, due, delta }) => (
            <li key={type}>
              <Card padding="md">
                <Card.Body>
                  <div className={styles.statusHead}>
                    <div className={styles.statusName}>
                      <span aria-hidden="true">{TYPE_EMOJI[type]}</span>
                      <h3 className={styles.statusTitle}>{t(`supplements.types.${type}`)}</h3>
                    </div>
                    {interval === null ? (
                      <Badge variant="default">{t('supplements.status.notDusted')}</Badge>
                    ) : (
                      <Badge variant={STATUS_VARIANT[status]}>
                        {status === 'never'
                          ? t('supplements.status.never')
                          : `${t(`supplements.status.${status}`)} · ${dDayLabel(delta ?? 0)}`}
                      </Badge>
                    )}
                  </div>

                  <dl className={styles.statusMeta}>
                    <div>
                      <dt>{t('supplements.lastDusted')}</dt>
                      <dd>{last ? last.dustedAt : t('supplements.never')}</dd>
                    </div>
                    <div>
                      <dt>{t('supplements.nextDue')}</dt>
                      <dd>{interval === null ? '—' : (due ?? t('supplements.logToStart'))}</dd>
                    </div>
                    <div>
                      <dt>{t('supplements.interval')}</dt>
                      <dd>
                        {interval === null
                          ? t('supplements.status.notDusted')
                          : t('supplements.everyNDays', { count: interval })}
                      </dd>
                    </div>
                  </dl>

                  <div className={styles.statusActions}>
                    <Button
                      type="button"
                      variant={status === 'due' || status === 'never' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => quickLog(type)}
                    >
                      {t('supplements.quickLog', { type: t(`supplements.types.${type}`) })}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.sectionTitle}>{t('supplements.form.title')}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.formRow}>
              <Select
                label={t('supplements.form.type')}
                options={SUPPLEMENT_TYPES.map((type) => ({
                  value: type,
                  label: t(`supplements.types.${type}`),
                }))}
                {...register('type')}
              />
              <Input
                type="date"
                label={t('supplements.form.dustedAt')}
                error={errors.dustedAt?.message ? t(errors.dustedAt.message) : undefined}
                {...register('dustedAt')}
              />
            </div>
            <Textarea
              label={t('supplements.form.note')}
              rows={2}
              placeholder={t('supplements.form.notePlaceholder')}
              helperText={t('supplements.form.noteHelper')}
              error={errors.note?.message ? t(errors.note.message) : undefined}
              {...register('note')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('supplements.form.submit')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      <section className={styles.historySection} aria-label={t('supplements.history.title')}>
        <h2 className={styles.sectionTitle}>{t('supplements.history.title')}</h2>
        {logs.length === 0 ? (
          <EmptyState
            icon="🦴"
            title={t('supplements.history.emptyTitle')}
            description={t('supplements.history.emptyDesc')}
          />
        ) : (
          <ul className={styles.list}>
            {logs.map((entry: DustingLog) => {
              const label = petLabel(entry.petId)
              const showThisBadge = label && (showPetBadge || entry.petId !== activePetId)
              return (
                <li key={entry.id}>
                  <Card padding="md">
                    <Card.Body>
                      <div className={styles.entryHead}>
                        <div className={styles.entryHeadLeft}>
                          <Badge variant="primary">
                            <span aria-hidden="true">{TYPE_EMOJI[entry.type]}</span>{' '}
                            {t(`supplements.types.${entry.type}`)}
                          </Badge>
                          <span className={styles.entryDate}>{entry.dustedAt}</span>
                          {showThisBadge && label && (
                            <Badge variant="default">
                              <span aria-hidden="true">{label.emoji}</span> {label.name}
                            </Badge>
                          )}
                        </div>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => removeLog(entry.id)}
                        >
                          {t('supplements.remove')}
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

      <p className={styles.disclaimer}>{t('supplements.disclaimer')}</p>
    </section>
  )
}

export default Supplements
