import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  DIARY_CATEGORIES,
  diaryFormSchema,
  diaryStats,
  useDiaryStore,
  type DiaryCategory,
  type DiaryFormValues,
} from '@features/diary'
import { useOnboardingStore } from '@features/onboarding'
import { useSpecies } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Diary.module.css'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function Diary() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('diary.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const entries = useDiaryStore((s) => s.entries)
  const addEntry = useDiaryStore((s) => s.addEntry)
  const removeEntry = useDiaryStore((s) => s.removeEntry)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DiaryFormValues>({
    resolver: zodResolver(diaryFormSchema),
    defaultValues: {
      category: 'feeding',
      occurredAt: todayIso(),
      body: '',
      weightGram: null,
      imageUrl: '',
    },
  })

  const watchedCategory = useWatch({ control, name: 'category' })
  const stats = useMemo(() => diaryStats(entries), [entries])

  const onSubmit = handleSubmit((values) => {
    addEntry({
      speciesId: profile.speciesId,
      category: values.category,
      occurredAt: values.occurredAt,
      body: values.body,
      weightGram: values.category === 'weight' ? (values.weightGram ?? null) : null,
      imageUrl: values.imageUrl?.trim() || null,
    })
    toast(t('common.save'), 'success')
    reset({
      category: values.category,
      occurredAt: todayIso(),
      body: '',
      weightGram: null,
      imageUrl: '',
    })
  })

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('diary.title')}</h1>
        <p className={styles.subtitle}>{t('diary.subtitle')}</p>
        {species && (
          <p className={styles.locationNote}>
            {species.heroEmoji} {species.koreanName}
          </p>
        )}
      </header>

      <Card padding="lg" className={styles.statsCard}>
        <Card.Body>
          <h2 className={styles.statsTitle}>{t('diary.stats.title')}</h2>
          <dl className={styles.statsGrid}>
            <div>
              <dt>{t('diary.stats.total')}</dt>
              <dd>{stats.total}</dd>
            </div>
            <div>
              <dt>{t('diary.stats.recent30')}</dt>
              <dd>{stats.recent30}</dd>
            </div>
            <div>
              <dt>{t('diary.stats.latestWeight')}</dt>
              <dd>{stats.latestWeight ? `${stats.latestWeight} g` : t('diary.stats.noWeight')}</dd>
            </div>
          </dl>
        </Card.Body>
      </Card>

      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.formTitle}>{t('diary.newEntry')}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <div className={styles.formRow}>
              <Select
                label={t('diary.category')}
                options={DIARY_CATEGORIES.map((c) => ({
                  value: c,
                  label: t(`diary.categories.${c}`),
                }))}
                {...register('category')}
              />
              <Input
                type="date"
                label={t('diary.occurredAt')}
                error={errors.occurredAt?.message ? t(errors.occurredAt.message) : undefined}
                {...register('occurredAt')}
              />
            </div>
            {watchedCategory === 'weight' && (
              <Input
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                label={t('diary.weight')}
                helperText={t('diary.weightOptional')}
                error={errors.weightGram?.message ? t(errors.weightGram.message) : undefined}
                {...register('weightGram', {
                  setValueAs: (v: unknown) => {
                    if (v === '' || v === null || v === undefined) return null
                    const num = Number(v)
                    return Number.isFinite(num) ? num : null
                  },
                })}
              />
            )}
            <Textarea
              label={t('diary.body')}
              rows={3}
              error={errors.body?.message ? t(errors.body.message) : undefined}
              {...register('body')}
            />
            <Input
              type="url"
              label={t('diary.imageUrl')}
              placeholder="https://…"
              helperText={t('diary.imageUrlHelper')}
              error={errors.imageUrl?.message ? t(errors.imageUrl.message) : undefined}
              {...register('imageUrl')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('diary.addEntry')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {entries.length === 0 ? (
        <EmptyState icon="📓" title={t('diary.emptyTitle')} description={t('diary.emptyDesc')} />
      ) : (
        <ul className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.id}>
              <Card padding="md">
                <Card.Body>
                  <div className={styles.entryHeader}>
                    <div className={styles.entryHeaderLeft}>
                      <Badge variant="primary">
                        {t(`diary.categories.${entry.category as DiaryCategory}`)}
                      </Badge>
                      <span className={styles.entryDate}>{entry.occurredAt}</span>
                      {entry.weightGram !== null && (
                        <Badge variant="success">{entry.weightGram} g</Badge>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removeEntry(entry.id)}
                    >
                      {t('diary.remove')}
                    </button>
                  </div>
                  <p className={styles.entryBody}>{entry.body}</p>
                  {entry.imageUrl && (
                    <img
                      src={entry.imageUrl}
                      alt={entry.body.slice(0, 60)}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className={styles.entryImage}
                    />
                  )}
                  {!entry.speciesId && (
                    <p className={styles.entryFooter}>{t('diary.speciesUnknown')}</p>
                  )}
                </Card.Body>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Diary
