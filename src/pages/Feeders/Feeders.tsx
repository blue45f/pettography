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
} from '@features/feeders'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Feeders.module.css'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
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

  const colonies = useFeedersStore((s) => s.colonies)
  const addColony = useFeedersStore((s) => s.addColony)
  const markFed = useFeedersStore((s) => s.markFed)
  const removeColony = useFeedersStore((s) => s.removeColony)

  const [expandedId, setExpandedId] = useState<string | null>(null)

  const today = todayIso()
  const sorted = useMemo(() => sortColonies(colonies, today), [colonies, today])

  const typeOptions = useMemo(
    () => FEEDER_TYPES.map((type) => ({ value: type, label: t(`feeders.types.${type}`) })),
    [t]
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeederFormValues>({
    resolver: zodResolver(feederFormSchema),
    defaultValues: {
      type: 'dubia',
      name: '',
      startedAt: today,
      estimateCount: null,
      notes: '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    addColony({
      type: values.type,
      name: values.name,
      startedAt: values.startedAt,
      estimateCount: values.estimateCount,
      notes: values.notes,
    })
    toast(t('feeders.toastAdded'), 'success')
    reset({ type: values.type, name: '', startedAt: today, estimateCount: null, notes: '' })
  })

  function handleMarkFed(colony: FeederColony) {
    markFed(colony.id, today)
    toast(t('feeders.toastFed', { name: colony.name }), 'success')
  }

  function handleRemove(colony: FeederColony) {
    removeColony(colony.id)
    if (expandedId === colony.id) setExpandedId(null)
    toast(t('feeders.toastRemoved'), 'info')
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('feeders.title')}</h1>
        <p className={styles.subtitle}>{t('feeders.subtitle')}</p>
      </header>

      <Card padding="md" className={styles.note}>
        <Card.Body>
          <p className={styles.noteText}>{t('feeders.gutLoadNote')}</p>
        </Card.Body>
      </Card>

      {/* Add culture */}
      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.sectionTitle}>{t('feeders.form.title')}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.formRow}>
              <Select
                label={t('feeders.form.type')}
                options={typeOptions}
                error={errors.type?.message ? t(errors.type.message) : undefined}
                {...register('type')}
              />
              <Input
                type="text"
                label={t('feeders.form.name')}
                placeholder={t('feeders.form.namePlaceholder')}
                error={errors.name?.message ? t(errors.name.message) : undefined}
                {...register('name')}
              />
            </div>
            <div className={styles.formRow}>
              <Input
                type="date"
                label={t('feeders.form.startedAt')}
                error={errors.startedAt?.message ? t(errors.startedAt.message) : undefined}
                {...register('startedAt')}
              />
              <Input
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                label={t('feeders.form.estimateCount')}
                helperText={t('feeders.form.estimateHelper')}
                error={errors.estimateCount?.message ? t(errors.estimateCount.message) : undefined}
                {...register('estimateCount', {
                  setValueAs: (v: unknown) => {
                    if (v === '' || v === null || v === undefined) return null
                    const num = Number(v)
                    return Number.isFinite(num) ? num : null
                  },
                })}
              />
            </div>
            <Textarea
              label={t('feeders.form.notes')}
              placeholder={t('feeders.form.notesPlaceholder')}
              rows={3}
              error={errors.notes?.message ? t(errors.notes.message) : undefined}
              {...register('notes')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('feeders.form.submit')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {/* Colony grid */}
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
                      <Badge variant={STATUS_VARIANT[status]}>
                        {t(`feeders.status.${status}`)}
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
                        <dt>{t('feeders.meta.lastFed')}</dt>
                        <dd>{colony.lastFedAt ?? t('feeders.meta.lastFedNever')}</dd>
                      </div>
                    </dl>

                    {colony.notes && <p className={styles.colonyNotes}>{colony.notes}</p>}

                    <button
                      type="button"
                      className={styles.careToggle}
                      aria-expanded={expanded}
                      onClick={() => setExpandedId(expanded ? null : colony.id)}
                    >
                      {expanded ? t('feeders.care.hide') : t('feeders.care.show')}
                    </button>
                    {expanded && (
                      <div className={styles.careBox}>
                        <p className={styles.careTip}>{t(`feeders.care.${colony.type}`)}</p>
                        {tempLabel && <p className={styles.careTemp}>{tempLabel}</p>}
                        <p className={styles.careProductivity}>
                          {t(`feeders.productivity.${colony.type}`)}
                        </p>
                      </div>
                    )}

                    <div className={styles.colonyActions}>
                      <Button type="button" variant="primary" onClick={() => handleMarkFed(colony)}>
                        {t('feeders.actions.markFed')}
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
