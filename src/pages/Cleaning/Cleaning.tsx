import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  CLEAN_TYPES,
  cleanStatus,
  cleaningFormSchema,
  cleaningStats,
  defaultIntervalDays,
  isWaterPrimary,
  latestByType,
  nextDue,
  useActivePetCleanings,
  useCleaningStore,
  type CleaningFormValues,
  type CleanStatus,
  type CleanType,
} from '@domains/cleaning'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpecies, useSpeciesList } from '@domains/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useToday } from '@hooks/useToday'
import { buildCsv } from '@utils/csv'
import { downloadTextFile } from '@utils/download'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Cleaning.module.css'

const STATUS_VARIANT: Record<CleanStatus, 'warning' | 'primary' | 'success' | 'default'> = {
  due: 'warning',
  soon: 'primary',
  ok: 'success',
  never: 'default',
}

function Cleaning() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('cleaning.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const pets = useOnboardingStore((s) => s.pets)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const activeLogs = useActivePetCleanings()
  const allLogs = useCleaningStore((s) => s.logs)
  const addLog = useCleaningStore((s) => s.addLog)
  const removeLog = useCleaningStore((s) => s.removeLog)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)
  const { data: speciesList = [] } = useSpeciesList({})

  const [showAllPets, setShowAllPets] = useState(false)
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const logs = showAllPets ? allLogs : activeLogs
  const showPetBadge = showAllPets && pets.length > 1
  const today = useToday()
  const category = profile.category

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CleaningFormValues>({
    resolver: zodResolver(cleaningFormSchema),
    defaultValues: { type: 'spot', cleanedAt: today, note: '' },
  })

  const stats = useMemo(() => cleaningStats(logs), [logs])

  const rows = useMemo(
    () =>
      CLEAN_TYPES.map((type) => {
        const latest = latestByType(activeLogs, type)
        const interval = defaultIntervalDays(type, category)
        const last = latest?.cleanedAt ?? null
        const status = cleanStatus(last, interval, today)
        const due = last ? nextDue(last, interval) : null
        return { type, last, interval, status, due }
      }),
    [activeLogs, category, today]
  )

  const petLabels = useMemo(() => {
    const speciesById = new Map(speciesList.map((item) => [item.id, item] as const))
    return new Map(
      pets.map((pet) => {
        const petSpecies = pet.speciesId ? speciesById.get(pet.speciesId) : undefined
        return [
          pet.id,
          {
            name:
              pet.petName?.trim() || petSpecies?.koreanName || t('petSwitcher.title', { count: 1 }),
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

  function logClean(type: CleanType): void {
    addLog({ speciesId: profile.speciesId, type, cleanedAt: today, note: '' })
    toast(t('cleaning.logged', { type: t(`cleaning.types.${type}`) }), 'success')
  }

  const onSubmit = handleSubmit((values) => {
    addLog({
      speciesId: profile.speciesId,
      type: values.type,
      cleanedAt: values.cleanedAt,
      note: values.note,
    })
    toast(t('common.save'), 'success')
    reset({ type: values.type, cleanedAt: today, note: '' })
  })

  function exportCsv() {
    const rows = [...logs]
      .sort((a, b) => a.cleanedAt.localeCompare(b.cleanedAt))
      .map((log) => [log.cleanedAt, log.type, log.note])
    downloadTextFile(
      'pettography-cleaning.csv',
      buildCsv(['date', 'type', 'note'], rows),
      'text/csv;charset=utf-8'
    )
  }

  function confirmRemove(id: string) {
    removeLog(id)
    setPendingRemoveId(null)
    toast(t('common.delete'), 'success')
  }

  function dueLabel(status: CleanStatus, due: string | null): string {
    if (status === 'never' || due === null) return t('cleaning.status.never')
    const left = Math.round(
      (new Date(`${due}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) /
        86_400_000
    )
    if (left === 0) return t('cleaning.dday.today')
    if (left < 0) return t('cleaning.dday.over', { count: Math.abs(left) })
    return t('cleaning.dday.left', { count: left })
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('cleaning.title')}</h1>
        <p className={styles.subtitle}>{t('cleaning.subtitle')}</p>
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
            {t('cleaning.showAllPets')}
          </label>
        )}
        {logs.length > 0 && (
          <Button variant="secondary" onClick={exportCsv} className={styles.exportButton}>
            {t('common.exportCsv')}
          </Button>
        )}
      </header>

      <Alert variant="info" title={t('cleaning.bioactive.title')}>
        {t('cleaning.bioactive.body')}
      </Alert>

      <div className={styles.statusGrid}>
        {rows.map((row) => {
          const waterMuted = row.type === 'water' && !isWaterPrimary(category)
          return (
            <Card key={row.type} padding="md" className={styles.statusCard}>
              <Card.Body className={styles.statusBody}>
                <div className={styles.statusTop}>
                  <div className={styles.statusTitleWrap}>
                    <h2 className={styles.statusTitle}>{t(`cleaning.types.${row.type}`)}</h2>
                    <p className={styles.statusDesc}>{t(`cleaning.typeDesc.${row.type}`)}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[row.status]}>
                    {dueLabel(row.status, row.due)}
                  </Badge>
                </div>
                <dl className={styles.statusMeta}>
                  <div>
                    <dt>{t('cleaning.lastCleaned')}</dt>
                    <dd>{row.last ?? t('cleaning.status.never')}</dd>
                  </div>
                  <div>
                    <dt>{t('cleaning.recommended')}</dt>
                    <dd>{t('cleaning.everyDays', { count: row.interval })}</dd>
                  </div>
                </dl>
                {waterMuted && <p className={styles.waterNote}>{t('cleaning.waterNote')}</p>}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => logClean(row.type)}
                >
                  {t('cleaning.cleanToday')}
                </Button>
              </Card.Body>
            </Card>
          )
        })}
      </div>

      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.formTitle}>{t('cleaning.newLog')}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.formRow}>
              <Select
                label={t('cleaning.type')}
                options={CLEAN_TYPES.map((c) => ({ value: c, label: t(`cleaning.types.${c}`) }))}
                {...register('type')}
              />
              <Input
                type="date"
                max={today}
                label={t('cleaning.cleanedAt')}
                error={errors.cleanedAt?.message ? t(errors.cleanedAt.message) : undefined}
                {...register('cleanedAt')}
              />
            </div>
            <Textarea
              label={t('cleaning.note')}
              rows={2}
              maxLength={200}
              placeholder={t('cleaning.notePlaceholder')}
              error={errors.note?.message ? t(errors.note.message) : undefined}
              {...register('note')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('cleaning.addLog')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      <section className={styles.historySection}>
        <div className={styles.historyHead}>
          <h2 className={styles.historyTitle}>{t('cleaning.history')}</h2>
          {stats.total > 0 && (
            <span className={styles.historyCount}>
              {t('cleaning.totalCount', { count: stats.total })}
            </span>
          )}
        </div>
        {logs.length === 0 ? (
          <EmptyState
            variant="log"
            icon="🧽"
            title={t('cleaning.emptyTitle')}
            description={t('cleaning.emptyDesc')}
            hint={t('cleaning.hint')}
          />
        ) : (
          <ul className={styles.list}>
            {[...logs]
              .sort((a, b) => b.cleanedAt.localeCompare(a.cleanedAt))
              .map((log) => {
                const label = petLabel(log.petId)
                const showBadge = label && (showPetBadge || log.petId !== activePetId)
                return (
                  <li key={log.id} className={styles.historyItem}>
                    <div className={styles.logHeader}>
                      <div className={styles.logHeaderLeft}>
                        <Badge variant="primary">{t(`cleaning.types.${log.type}`)}</Badge>
                        <time className={styles.logDate} dateTime={log.cleanedAt}>
                          {log.cleanedAt}
                        </time>
                        {showBadge && (
                          <Badge variant="default">
                            <span aria-hidden="true">{label.emoji}</span> {label.name}
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        className={styles.removeButton}
                        aria-expanded={pendingRemoveId === log.id}
                        aria-controls={`cleaning-remove-${log.id}`}
                        onClick={() =>
                          setPendingRemoveId((current) => (current === log.id ? null : log.id))
                        }
                      >
                        {t('cleaning.remove')}
                      </button>
                    </div>
                    {log.note && <p className={styles.logNote}>{log.note}</p>}
                    {pendingRemoveId === log.id && (
                      <div id={`cleaning-remove-${log.id}`} className={styles.deleteConfirm}>
                        <span className={styles.deletePrompt}>{t('cleaning.remove')}?</span>
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
                          onClick={() => confirmRemove(log.id)}
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
    </section>
  )
}

export default Cleaning
