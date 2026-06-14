import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import ContentImage from '@components/common/ContentImage'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  DIARY_CATEGORIES,
  diaryFormSchema,
  diaryStats,
  useActivePetDiary,
  useDiaryStore,
  type DiaryCategory,
  type DiaryFormValues,
} from '@domains/diary'
import { useOnboardingStore } from '@domains/onboarding'
import { useSpecies, useSpeciesList } from '@domains/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect, useMemo, useState } from 'react'
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
  const pets = useOnboardingStore((s) => s.pets)
  const activePetId = useOnboardingStore((s) => s.activePetId)
  const activeEntries = useActivePetDiary()
  const allEntries = useDiaryStore((s) => s.entries)
  const addEntry = useDiaryStore((s) => s.addEntry)
  const removeEntry = useDiaryStore((s) => s.removeEntry)
  const { data: species } = useSpecies(profile.speciesId ?? undefined)
  const { data: speciesList = [] } = useSpeciesList({})

  const [showAllPets, setShowAllPets] = useState(false)
  const entries = showAllPets ? allEntries : activeEntries
  const showPetBadge = showAllPets && pets.length > 1

  function petLabel(petId: string | null | undefined): { name: string; emoji: string } | null {
    if (!petId) return null
    const pet = pets.find((p) => p.id === petId)
    if (!pet) return null
    const sp = speciesList.find((s) => s.id === pet.speciesId)
    return {
      name: pet.petName?.trim() || sp?.koreanName || t('petSwitcher.title', { count: 1 }),
      emoji: sp?.heroEmoji ?? '🐾',
    }
  }

  const DRAFT_KEY = 'pettography.diary.draft'
  const DEFAULT_FORM_VALUES: DiaryFormValues = useMemo(
    () => ({
      category: 'feeding',
      occurredAt: todayIso(),
      body: '',
      weightGram: null,
      imageUrl: '',
    }),
    []
  )

  const [initialDraft] = useState<DiaryFormValues>(() => {
    if (typeof window === 'undefined') return DEFAULT_FORM_VALUES
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY)
      if (!raw) return DEFAULT_FORM_VALUES
      return JSON.parse(raw) as DiaryFormValues
    } catch {
      return DEFAULT_FORM_VALUES
    }
  })

  const hasSavedDraft = useMemo(() => {
    if (typeof window === 'undefined') return false
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY)
      if (!raw) return false
      const parsed = JSON.parse(raw) as DiaryFormValues
      return (parsed.body?.trim() || '') !== '' || (parsed.imageUrl?.trim() || '') !== ''
    } catch {
      return false
    }
  }, [])

  const [draftDismissed, setDraftDismissed] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DiaryFormValues>({
    resolver: zodResolver(diaryFormSchema),
    defaultValues: initialDraft,
  })

  // Watch and auto-save draft to localStorage with debounce
  useEffect(() => {
    if (typeof window === 'undefined') return
    let timerId: number | undefined
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = watch((data) => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId)
      }
      timerId = window.setTimeout(() => {
        try {
          window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
        } catch {
          // silently ignore quota errors
        }
      }, 600) as unknown as number
    })
    return () => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId)
      }
      subscription.unsubscribe()
    }
  }, [watch])

  const discardDraft = () => {
    try {
      window.localStorage.removeItem(DRAFT_KEY)
    } catch {
      // ignore
    }
    reset(DEFAULT_FORM_VALUES)
    setDraftDismissed(true)
    toast(t('diary.draftDiscarded', '임시 저장된 일지를 초기화했습니다.'), 'info')
  }

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
    try {
      window.localStorage.removeItem(DRAFT_KEY)
    } catch {
      // ignore
    }
    reset({
      category: values.category,
      occurredAt: todayIso(),
      body: '',
      weightGram: null,
      imageUrl: '',
    })
    setDraftDismissed(true)
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
        {pets.length > 1 && (
          <label className={styles.showAllToggle}>
            <input
              type="checkbox"
              checked={showAllPets}
              onChange={(e) => setShowAllPets(e.target.checked)}
            />
            {t('diary.showAllPets')}
          </label>
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
          {hasSavedDraft && !draftDismissed && (
            <div className={styles.draftAlert} role="status">
              <span className={styles.draftAlertText}>
                ✍️ {t('diary.draftLoaded', '작성 중이던 임시 저장본을 불러왔습니다.')}
              </span>
              <Button size="sm" variant="outline" onClick={discardDraft}>
                {t('diary.discardDraft', '초기화')}
              </Button>
            </div>
          )}
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
        <EmptyState
          variant="log"
          icon="📓"
          title={t('diary.emptyTitle')}
          description={t('diary.emptyDesc')}
          hint={t('diary.hint')}
        />
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
                      {(() => {
                        const label = petLabel(entry.petId)
                        if (!label) return null
                        // Hide the badge when the active-pet view already
                        // implies which pet this entry belongs to.
                        if (!showPetBadge && entry.petId === activePetId) return null
                        return (
                          <Badge variant="default">
                            <span aria-hidden="true">{label.emoji}</span> {label.name}
                          </Badge>
                        )
                      })()}
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
                    <ContentImage
                      src={entry.imageUrl}
                      alt={entry.body.slice(0, 60)}
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
