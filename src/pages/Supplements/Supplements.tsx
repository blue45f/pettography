import Alert from '@components/common/Alert'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpecies } from '@domains/species'
import {
  SUPPLEMENT_TYPES,
  dustingFormSchema,
  dustingStats,
  useActivePetDustings,
  useSupplementsStore,
  type DustingFormValues,
  type SupplementType,
} from '@domains/supplements'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Supplements.module.css'

const MSD_NUTRITION_URL =
  'https://www.msdvetmanual.com/management-and-nutrition/nutrition-exotic-and-zoo-animals/nutrition-in-reptiles'

const TYPE_EMOJI: Record<SupplementType, string> = {
  calcium: '🦴',
  calciumD3: '☀️',
  multivitamin: '💊',
}

function localTodayIso(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function Supplements() {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('supplements.title'))

  const profile = useOnboardingStore((state) => state.profile)
  const activePetId = useOnboardingStore((state) => state.activePetId)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)
  const logs = useActivePetDustings()
  const addLog = useSupplementsStore((state) => state.addLog)
  const removeLog = useSupplementsStore((state) => state.removeLog)
  const stats = useMemo(() => dustingStats(logs), [logs])
  const today = localTodayIso()

  const form = useForm<DustingFormValues>({
    resolver: zodResolver(dustingFormSchema),
    defaultValues: { type: 'calcium', dustedAt: today, note: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    if (!activePetId) return
    addLog({
      petId: activePetId,
      speciesId: profile.speciesId,
      type: values.type,
      dustedAt: values.dustedAt,
      note: values.note.trim(),
    })
    toast(t('supplements.logged'), 'success')
    form.reset({ type: values.type, dustedAt: today, note: '' })
  })

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(i18n.resolvedLanguage ?? 'ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(`${iso}T00:00:00`))
  }

  function handleRemove(id: string) {
    if (!window.confirm(t('supplements.removeConfirm'))) return
    removeLog(id)
    toast(t('supplements.removed'), 'info')
  }

  if (!activePetId) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{t('supplements.eyebrow')}</p>
          <h1>{t('supplements.title')}</h1>
          <p className={styles.subtitle}>{t('supplements.subtitle')}</p>
        </header>
        <Card padding="lg" className={styles.petGate}>
          <Card.Body>
            <span className={styles.gateIcon} aria-hidden="true">
              🐾
            </span>
            <h2>{t('supplements.petRequiredTitle')}</h2>
            <p>{t('supplements.petRequiredBody')}</p>
            <Link to="/onboarding" className={styles.primaryLink}>
              {t('supplements.petRequiredAction')}
            </Link>
          </Card.Body>
        </Card>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('supplements.eyebrow')}</p>
        <h1>{t('supplements.title')}</h1>
        <p className={styles.subtitle}>{t('supplements.subtitle')}</p>
        <div className={styles.petContext}>
          <span aria-hidden="true">{species?.heroEmoji ?? '🐾'}</span>
          <span>{profile.petName?.trim() || species?.koreanName || t('supplements.aPet')}</span>
        </div>
      </header>

      <Alert variant="warning" title={t('supplements.safeTitle')}>
        <p>{t('supplements.safeBody')}</p>
        <a className={styles.sourceLink} href={MSD_NUTRITION_URL} target="_blank" rel="noreferrer">
          {t('supplements.sourceLink')}
        </a>
      </Alert>

      <div className={styles.workspace}>
        <Card padding="lg">
          <Card.Body>
            <p className={styles.sectionKicker}>{t('supplements.form.kicker')}</p>
            <h2 className={styles.sectionTitle}>{t('supplements.form.title')}</h2>
            <p className={styles.sectionHelp}>{t('supplements.form.safeHelper')}</p>
            <form onSubmit={onSubmit} className={styles.form} noValidate>
              <div className={styles.formRow}>
                <Select
                  label={t('supplements.form.type')}
                  options={SUPPLEMENT_TYPES.map((type) => ({
                    value: type,
                    label: `${TYPE_EMOJI[type]} ${t(`supplements.types.${type}`)}`,
                  }))}
                  error={
                    form.formState.errors.type?.message
                      ? t(form.formState.errors.type.message)
                      : undefined
                  }
                  {...form.register('type')}
                />
                <Input
                  type="date"
                  max={today}
                  label={t('supplements.form.dustedAt')}
                  error={
                    form.formState.errors.dustedAt?.message
                      ? t(form.formState.errors.dustedAt.message)
                      : undefined
                  }
                  {...form.register('dustedAt')}
                />
              </div>
              <Textarea
                label={t('supplements.form.note')}
                rows={3}
                maxLength={200}
                placeholder={t('supplements.form.notePlaceholder')}
                helperText={t('supplements.form.noteHelper')}
                error={
                  form.formState.errors.note?.message
                    ? t(form.formState.errors.note.message)
                    : undefined
                }
                {...form.register('note')}
              />
              <div className={styles.formActions}>
                <Button type="submit" variant="primary" isLoading={form.formState.isSubmitting}>
                  {t('supplements.form.submit')}
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>

        <Card padding="lg" className={styles.summaryCard}>
          <Card.Body>
            <p className={styles.sectionKicker}>{t('supplements.stats.kicker')}</p>
            <h2 className={styles.sectionTitle}>{t('supplements.stats.title')}</h2>
            <dl className={styles.statsGrid}>
              <div>
                <dt>{t('supplements.stats.total')}</dt>
                <dd>{stats.total}</dd>
              </div>
              <div>
                <dt>{t('supplements.stats.lastDusted')}</dt>
                <dd>
                  {stats.lastDusted ? formatDate(stats.lastDusted) : t('supplements.stats.never')}
                </dd>
              </div>
              {SUPPLEMENT_TYPES.map((type) => (
                <div key={type}>
                  <dt>{t(`supplements.types.${type}`)}</dt>
                  <dd>{stats.byType[type]}</dd>
                </div>
              ))}
            </dl>
            <p className={styles.summaryNote}>{t('supplements.stats.recordOnly')}</p>
          </Card.Body>
        </Card>
      </div>

      <section aria-labelledby="supplement-history-title">
        <div className={styles.historyHead}>
          <h2 id="supplement-history-title" className={styles.sectionTitle}>
            {t('supplements.history.title')}
          </h2>
          {logs.length > 0 && (
            <span className={styles.countPill}>
              {t('supplements.history.count', { count: logs.length })}
            </span>
          )}
        </div>
        {logs.length === 0 ? (
          <EmptyState
            variant="log"
            icon="🦴"
            title={t('supplements.history.emptyTitle')}
            description={t('supplements.history.emptyDesc')}
            hint={t('supplements.history.hint')}
          />
        ) : (
          <ul className={styles.list}>
            {logs.map((entry) => (
              <li key={entry.id}>
                <Card padding="md">
                  <Card.Body>
                    <div className={styles.entryHead}>
                      <div className={styles.entryHeadLeft}>
                        <Badge variant="primary">
                          <span aria-hidden="true">{TYPE_EMOJI[entry.type]}</span>{' '}
                          {t(`supplements.types.${entry.type}`)}
                        </Badge>
                        <time className={styles.entryDate} dateTime={entry.dustedAt}>
                          {formatDate(entry.dustedAt)}
                        </time>
                      </div>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => handleRemove(entry.id)}
                      >
                        {t('supplements.remove')}
                      </button>
                    </div>
                    {entry.note && <p className={styles.entryNote}>{entry.note}</p>}
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

export default Supplements
