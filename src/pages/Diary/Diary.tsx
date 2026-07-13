import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import ContentImage from '@components/common/ContentImage'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
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
  const now = new Date()
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return localTime.toISOString().slice(0, 10)
}

const LEGACY_DRAFT_KEY = 'pettography.diary.draft'
const DRAFT_KEY_PREFIX = `${LEGACY_DRAFT_KEY}.`

function createDefaultFormValues(category: DiaryCategory = 'feeding'): DiaryFormValues {
  return {
    category,
    occurredAt: todayIso(),
    body: '',
    weightGram: null,
    imageUrl: '',
  }
}

function normalizeDraft(value: unknown): DiaryFormValues | null {
  if (!value || typeof value !== 'object') return null
  const draft = value as Partial<DiaryFormValues>
  const category = DIARY_CATEGORIES.includes(draft.category as DiaryCategory)
    ? (draft.category as DiaryCategory)
    : 'feeding'
  return {
    category,
    occurredAt:
      typeof draft.occurredAt === 'string' && draft.occurredAt ? draft.occurredAt : todayIso(),
    body: typeof draft.body === 'string' ? draft.body : '',
    weightGram:
      typeof draft.weightGram === 'number' && Number.isFinite(draft.weightGram)
        ? draft.weightGram
        : null,
    imageUrl: typeof draft.imageUrl === 'string' ? draft.imageUrl : '',
  }
}

function readDraft(key: string): DiaryFormValues | null {
  if (typeof window === 'undefined') return null
  try {
    const scopedRaw = globalThis.localStorage.getItem(key)
    const legacyRaw = scopedRaw ? null : globalThis.localStorage.getItem(LEGACY_DRAFT_KEY)
    const raw = scopedRaw ?? legacyRaw
    if (!raw) return null
    const draft = normalizeDraft(JSON.parse(raw))
    if (draft && legacyRaw) {
      globalThis.localStorage.setItem(key, JSON.stringify(draft))
      globalThis.localStorage.removeItem(LEGACY_DRAFT_KEY)
    }
    return draft
  } catch {
    return null
  }
}

function isMeaningfulDraft(draft: DiaryFormValues): boolean {
  return Boolean(
    draft.body.trim() ||
    draft.imageUrl?.trim() ||
    draft.weightGram !== null ||
    draft.category !== 'feeding' ||
    draft.occurredAt !== todayIso()
  )
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
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const entries = showAllPets ? allEntries : activeEntries
  const showPetBadge = showAllPets && pets.length > 1

  const petLabels = useMemo(() => {
    const labels = new Map<string, { name: string; emoji: string }>()
    for (const pet of pets) {
      const matchedSpecies = speciesList.find((item) => item.id === pet.speciesId)
      labels.set(pet.id, {
        name:
          pet.petName?.trim() || matchedSpecies?.koreanName || t('petSwitcher.title', { count: 1 }),
        emoji: matchedSpecies?.heroEmoji ?? '🐾',
      })
    }
    return labels
  }, [pets, speciesList, t])

  const entriesWithLabels = useMemo(
    () =>
      entries.map((entry) => ({
        entry,
        petLabel: entry.petId ? (petLabels.get(entry.petId) ?? null) : null,
      })),
    [entries, petLabels]
  )

  const draftKey = `${DRAFT_KEY_PREFIX}${activePetId ?? 'unassigned'}`

  const [initialDraft] = useState<DiaryFormValues>(() => {
    return readDraft(draftKey) ?? createDefaultFormValues()
  })

  const [hasSavedDraft, setHasSavedDraft] = useState(() => isMeaningfulDraft(initialDraft))
  const [draftDismissed, setDraftDismissed] = useState(false)
  const [showImageField, setShowImageField] = useState(Boolean(initialDraft.imageUrl?.trim()))

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DiaryFormValues>({
    resolver: zodResolver(diaryFormSchema),
    defaultValues: initialDraft,
  })

  useEffect(() => {
    const nextDraft = readDraft(draftKey) ?? createDefaultFormValues()
    reset(nextDraft)
    setHasSavedDraft(isMeaningfulDraft(nextDraft))
    setDraftDismissed(false)
    setShowImageField(Boolean(nextDraft.imageUrl?.trim()))
  }, [draftKey, reset])

  // Watch and auto-save draft to localStorage with debounce
  useEffect(() => {
    if (typeof window === 'undefined') return
    let timerId: number | undefined
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = watch((data) => {
      if (timerId !== undefined) {
        globalThis.clearTimeout(timerId)
      }
      timerId = globalThis.setTimeout(() => {
        try {
          globalThis.localStorage.setItem(draftKey, JSON.stringify(data))
        } catch {
          // silently ignore quota errors
        }
      }, 600) as unknown as number
    })
    return () => {
      if (timerId !== undefined) {
        globalThis.clearTimeout(timerId)
      }
      subscription.unsubscribe()
    }
  }, [draftKey, watch])

  const discardDraft = () => {
    try {
      globalThis.localStorage.removeItem(draftKey)
    } catch {
      // ignore
    }
    reset(createDefaultFormValues())
    setHasSavedDraft(false)
    setDraftDismissed(true)
    setShowImageField(false)
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
      globalThis.localStorage.removeItem(draftKey)
    } catch {
      // ignore
    }
    reset(createDefaultFormValues(values.category))
    setHasSavedDraft(false)
    setDraftDismissed(true)
    setShowImageField(false)
  })

  function confirmRemove(entryId: string) {
    removeEntry(entryId)
    setPendingRemoveId(null)
    toast(t('common.delete'), 'success')
  }

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

      <Card padding="lg" className={styles.composerCard}>
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
            <div className={styles.formTopRow}>
              <fieldset className={styles.categoryFieldset}>
                <legend>{t('diary.category')}</legend>
                <input type="hidden" {...register('category')} />
                <div className={styles.categoryChips}>
                  {DIARY_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={[
                        styles.categoryChip,
                        watchedCategory === category ? styles.categoryChipActive : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-pressed={watchedCategory === category}
                      onClick={() => setValue('category', category, { shouldDirty: true })}
                    >
                      {t(`diary.categories.${category}`)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className={styles.dateField}>
                <Input
                  type="date"
                  label={t('diary.occurredAt')}
                  error={errors.occurredAt?.message ? t(errors.occurredAt.message) : undefined}
                  {...register('occurredAt')}
                />
              </div>
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
              maxLength={500}
              error={errors.body?.message ? t(errors.body.message) : undefined}
              {...register('body')}
            />
            <details
              className={styles.optionalFields}
              open={showImageField}
              onToggle={(event) => setShowImageField(event.currentTarget.open)}
            >
              <summary>{t('diary.imageUrl')}</summary>
              <div className={styles.optionalFieldsBody}>
                <Input
                  type="url"
                  inputMode="url"
                  label={t('diary.imageUrl')}
                  placeholder="https://…"
                  helperText={t('diary.imageUrlHelper')}
                  error={errors.imageUrl?.message ? t(errors.imageUrl.message) : undefined}
                  {...register('imageUrl')}
                />
              </div>
            </details>
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('diary.addEntry')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      <section className={styles.statsCard} aria-labelledby="diary-stats-heading">
        <h2 id="diary-stats-heading" className={styles.statsTitle}>
          {t('diary.stats.title')}
        </h2>
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
      </section>

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
          {entriesWithLabels.map(({ entry, petLabel }) => (
            <li key={entry.id} className={styles.entryItem}>
              <div className={styles.entryHeader}>
                <div className={styles.entryHeaderLeft}>
                  <Badge variant="primary">
                    {t(`diary.categories.${entry.category as DiaryCategory}`)}
                  </Badge>
                  <span className={styles.entryDate}>{entry.occurredAt}</span>
                  {entry.weightGram !== null && (
                    <Badge variant="success">{entry.weightGram} g</Badge>
                  )}
                  {petLabel && (showPetBadge || entry.petId !== activePetId) && (
                    <Badge variant="default">
                      <span aria-hidden="true">{petLabel.emoji}</span> {petLabel.name}
                    </Badge>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => setPendingRemoveId(entry.id)}
                  aria-expanded={pendingRemoveId === entry.id}
                  aria-controls={`remove-entry-${entry.id}`}
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
              {pendingRemoveId === entry.id && (
                <div
                  id={`remove-entry-${entry.id}`}
                  className={styles.deleteConfirm}
                  role="group"
                  aria-label={t('diary.remove')}
                >
                  <span className={styles.deletePrompt}>{t('diary.remove')}?</span>
                  <button
                    type="button"
                    className={styles.confirmDelete}
                    onClick={() => confirmRemove(entry.id)}
                  >
                    {t('common.delete')}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelDelete}
                    onClick={() => setPendingRemoveId(null)}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Diary
