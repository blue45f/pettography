import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  FEEDER_TYPES,
  careFor,
  colonyAgeDays,
  feederFormSchema,
  feedStatus,
  sortColonies,
  useFeedersStore,
  type FeederColony,
  type FeederFormValues,
  type FeedStatus,
} from '@domains/feeders'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Feeders.module.css'

function localTodayIso(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

const STATUS_VARIANT: Record<FeedStatus, 'default' | 'primary' | 'success' | 'warning'> = {
  fedRecently: 'success',
  feedSoon: 'primary',
  overdue: 'warning',
  never: 'default',
}

function Feeders() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('feeders.title'))

  const colonies = useFeedersStore((state) => state.colonies)
  const addColony = useFeedersStore((state) => state.addColony)
  const markFed = useFeedersStore((state) => state.markFed)
  const removeColony = useFeedersStore((state) => state.removeColony)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const today = localTodayIso()
  const sorted = useMemo(() => sortColonies(colonies, today), [colonies, today])
  const typeOptions = useMemo(
    () => FEEDER_TYPES.map((type) => ({ value: type, label: t(`feeders.types.${type}`) })),
    [t]
  )

  const form = useForm<FeederFormValues>({
    resolver: zodResolver(feederFormSchema),
    defaultValues: {
      type: 'dubia',
      name: '',
      startedAt: today,
      estimateCount: null,
      notes: '',
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    addColony({
      type: values.type,
      name: values.name.trim(),
      startedAt: values.startedAt,
      estimateCount: values.estimateCount,
      notes: values.notes.trim(),
    })
    toast(t('feeders.toastAdded'), 'success')
    form.reset({ type: values.type, name: '', startedAt: today, estimateCount: null, notes: '' })
  })

  function handleMarkFed(colony: FeederColony) {
    const cleanupCrew = careFor(colony.type).cleanupCrew
    markFed(colony.id, today)
    toast(
      cleanupCrew
        ? t('feeders.toastMaintained', { name: colony.name })
        : t('feeders.toastFed', { name: colony.name }),
      'success'
    )
  }

  function handleRemove(colony: FeederColony) {
    if (!window.confirm(t('feeders.removeConfirm', { name: colony.name }))) return
    removeColony(colony.id)
    if (expandedId === colony.id) setExpandedId(null)
    toast(t('feeders.toastRemoved'), 'info')
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('feeders.eyebrow')}</p>
        <h1>{t('feeders.title')}</h1>
        <p className={styles.subtitle}>{t('feeders.subtitle')}</p>
      </header>

      <Card padding="md" className={styles.note}>
        <Card.Body>
          <strong className={styles.noteTitle}>{t('feeders.safetyTitle')}</strong>
          <p className={styles.noteText}>{t('feeders.gutLoadNote')}</p>
          <p className={styles.noteFine}>{t('feeders.safetyNote')}</p>
        </Card.Body>
      </Card>

      <Card padding="lg">
        <Card.Body>
          <p className={styles.sectionKicker}>{t('feeders.form.kicker')}</p>
          <h2 className={styles.sectionTitle}>{t('feeders.form.title')}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.formRow}>
              <Select
                label={t('feeders.form.type')}
                options={typeOptions}
                error={
                  form.formState.errors.type?.message
                    ? t(form.formState.errors.type.message)
                    : undefined
                }
                {...form.register('type')}
              />
              <Input
                type="text"
                maxLength={60}
                label={t('feeders.form.name')}
                placeholder={t('feeders.form.namePlaceholder')}
                error={
                  form.formState.errors.name?.message
                    ? t(form.formState.errors.name.message)
                    : undefined
                }
                {...form.register('name')}
              />
            </div>
            <div className={styles.formRow}>
              <Input
                type="date"
                max={today}
                label={t('feeders.form.startedAt')}
                error={
                  form.formState.errors.startedAt?.message
                    ? t(form.formState.errors.startedAt.message)
                    : undefined
                }
                {...form.register('startedAt')}
              />
              <Input
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                max="1000000"
                label={t('feeders.form.estimateCount')}
                helperText={t('feeders.form.estimateHelper')}
                error={
                  form.formState.errors.estimateCount?.message
                    ? t(form.formState.errors.estimateCount.message)
                    : undefined
                }
                {...form.register('estimateCount', {
                  setValueAs: (value: unknown) => {
                    if (value === '' || value === null || value === undefined) return null
                    const parsed = Number(value)
                    return Number.isFinite(parsed) ? parsed : null
                  },
                })}
              />
            </div>
            <Textarea
              label={t('feeders.form.notes')}
              placeholder={t('feeders.form.notesPlaceholder')}
              rows={3}
              maxLength={300}
              error={
                form.formState.errors.notes?.message
                  ? t(form.formState.errors.notes.message)
                  : undefined
              }
              {...form.register('notes')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={form.formState.isSubmitting}>
                {t('feeders.form.submit')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {sorted.length === 0 ? (
        <EmptyState
          icon="🦗"
          title={t('feeders.empty.title')}
          description={t('feeders.empty.desc')}
        />
      ) : (
        <ul className={styles.grid}>
          {sorted.map((colony) => {
            const care = careFor(colony.type)
            const status = feedStatus(colony.lastFedAt, today)
            const age = colonyAgeDays(colony, today)
            const expanded = expandedId === colony.id
            const statusLabel = care.cleanupCrew
              ? t(`feeders.maintenanceStatus.${colony.lastFedAt ? 'recorded' : 'never'}`)
              : t(`feeders.status.${status}`)
            const tempLabel =
              care.tempMinC !== null && care.tempMaxC !== null
                ? t('feeders.care.tempRange', { min: care.tempMinC, max: care.tempMaxC })
                : null
            return (
              <li key={colony.id}>
                <Card padding="md" className={styles.colonyCard}>
                  <Card.Body>
                    <div className={styles.colonyHead}>
                      <Badge variant="default">
                        <span aria-hidden="true">{care.emoji}</span>{' '}
                        {t(`feeders.types.${colony.type}`)}
                      </Badge>
                      <Badge variant={care.cleanupCrew ? 'default' : STATUS_VARIANT[status]}>
                        {statusLabel}
                      </Badge>
                    </div>
                    <h3 className={styles.colonyName}>{colony.name}</h3>
                    <dl className={styles.metaGrid}>
                      <div className={styles.metaItem}>
                        <dt>{t('feeders.meta.age')}</dt>
                        <dd>{t('feeders.meta.ageValue', { count: age })}</dd>
                      </div>
                      <div className={styles.metaItem}>
                        <dt>{t('feeders.meta.estimate')}</dt>
                        <dd>
                          {colony.estimateCount !== null
                            ? t('feeders.meta.estimateValue', { count: colony.estimateCount })
                            : t('feeders.meta.estimateUnknown')}
                        </dd>
                      </div>
                      <div className={styles.metaItem}>
                        <dt>
                          {care.cleanupCrew
                            ? t('feeders.meta.lastMaintained')
                            : t('feeders.meta.lastFed')}
                        </dt>
                        <dd>{colony.lastFedAt ?? t('feeders.meta.lastFedNever')}</dd>
                      </div>
                    </dl>
                    {colony.notes && <p className={styles.colonyNotes}>{colony.notes}</p>}
                    <button
                      type="button"
                      className={styles.careToggle}
                      aria-expanded={expanded}
                      aria-controls={`feeder-care-${colony.id}`}
                      onClick={() => setExpandedId(expanded ? null : colony.id)}
                    >
                      {expanded ? t('feeders.care.hide') : t('feeders.care.show')}
                    </button>
                    {expanded && (
                      <div id={`feeder-care-${colony.id}`} className={styles.careBox}>
                        <p className={styles.careTip}>{t(`feeders.care.${colony.type}`)}</p>
                        {tempLabel && <p className={styles.careTemp}>{tempLabel}</p>}
                        <p className={styles.careProductivity}>
                          {t(`feeders.productivity.${colony.type}`)}
                        </p>
                      </div>
                    )}
                    <div className={styles.colonyActions}>
                      <Button type="button" variant="primary" onClick={() => handleMarkFed(colony)}>
                        {care.cleanupCrew
                          ? t('feeders.actions.markMaintained')
                          : t('feeders.actions.markFed')}
                      </Button>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => handleRemove(colony)}
                      >
                        {t('feeders.actions.remove')}
                      </button>
                    </div>
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

export default Feeders
