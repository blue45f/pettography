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
import { useSpeciesList, type Difficulty, type Species } from '@features/species'
import {
  PRIORITIES,
  READINESS_ITEMS,
  daysUntil,
  experienceMatch,
  readinessPct,
  sortWishlist,
  useWishlistStore,
  wishlistFormSchema,
  type Priority,
  type WishlistFormValues,
  type WishlistItem,
} from '@features/wishlist'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Wishlist.module.css'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'

const PRIORITY_BADGE: Record<Priority, BadgeVariant> = {
  next: 'primary',
  soon: 'warning',
  someday: 'default',
}

const DIFFICULTY_BADGE: Record<Difficulty, BadgeVariant> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'error',
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const KRW = new Intl.NumberFormat('ko-KR')

function Wishlist() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('wishlist.title'))

  const { data: speciesList = [] } = useSpeciesList({})
  const items = useWishlistStore((s) => s.items)
  const addItem = useWishlistStore((s) => s.addItem)
  const toggleReadiness = useWishlistStore((s) => s.toggleReadiness)
  const removeItem = useWishlistStore((s) => s.removeItem)

  const speciesById = useMemo(() => {
    const map = new Map<string, Species>()
    for (const s of speciesList) map.set(s.id, s)
    return map
  }, [speciesList])

  const sorted = useMemo(() => sortWishlist(items), [items])
  const today = todayIso()
  const totalReadiness = READINESS_ITEMS.length

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WishlistFormValues>({
    resolver: zodResolver(wishlistFormSchema),
    defaultValues: {
      speciesId: '',
      priority: 'someday',
      targetDate: '',
      notes: '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    addItem({
      speciesId: values.speciesId,
      priority: values.priority,
      targetDate: values.targetDate || null,
      notes: values.notes,
    })
    toast(t('wishlist.added'), 'success')
    reset({ speciesId: '', priority: 'someday', targetDate: '', notes: '' })
  })

  function dDayLabel(targetDate: string): { text: string; tone: 'past' | 'today' | 'future' } {
    const diff = daysUntil(targetDate, today)
    if (diff === 0) return { text: t('wishlist.dday.today'), tone: 'today' }
    if (diff < 0) return { text: t('wishlist.dday.past', { days: Math.abs(diff) }), tone: 'past' }
    return { text: t('wishlist.dday.future', { days: diff }), tone: 'future' }
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('wishlist.title')}</h1>
        <p className={styles.subtitle}>{t('wishlist.subtitle')}</p>
      </header>

      <p className={styles.responsibleNote}>{t('wishlist.responsibleNote')}</p>

      <Card padding="lg">
        <Card.Body>
          <h2 className={styles.formTitle}>{t('wishlist.form.title')}</h2>
          <form onSubmit={onSubmit} className={styles.form} noValidate>
            <Select
              label={t('wishlist.form.species')}
              placeholder={t('wishlist.form.speciesPlaceholder')}
              options={speciesList.map((s) => ({
                value: s.id,
                label: `${s.heroEmoji} ${s.koreanName}`,
              }))}
              error={errors.speciesId?.message ? t(errors.speciesId.message) : undefined}
              {...register('speciesId')}
            />
            <div className={styles.formRow}>
              <Select
                label={t('wishlist.form.priority')}
                options={PRIORITIES.map((p) => ({
                  value: p,
                  label: t(`wishlist.priority.${p}`),
                }))}
                {...register('priority')}
              />
              <Input
                type="date"
                label={t('wishlist.form.targetDate')}
                helperText={t('wishlist.form.targetDateHelper')}
                error={errors.targetDate?.message ? t(errors.targetDate.message) : undefined}
                {...register('targetDate')}
              />
            </div>
            <Textarea
              label={t('wishlist.form.notes')}
              rows={2}
              placeholder={t('wishlist.form.notesPlaceholder')}
              error={errors.notes?.message ? t(errors.notes.message) : undefined}
              {...register('notes')}
            />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('wishlist.form.submit')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {sorted.length === 0 ? (
        <EmptyState
          icon="🌱"
          title={t('wishlist.empty.title')}
          description={t('wishlist.empty.desc')}
        />
      ) : (
        <ul className={styles.list}>
          {sorted.map((item) => (
            <WishCard
              key={item.id}
              item={item}
              species={speciesById.get(item.speciesId) ?? null}
              pct={readinessPct(item, totalReadiness)}
              dDay={item.targetDate ? dDayLabel(item.targetDate) : null}
              onToggle={(key) => toggleReadiness(item.id, key)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

interface WishCardProps {
  item: WishlistItem
  species: Species | null
  pct: number
  dDay: { text: string; tone: 'past' | 'today' | 'future' } | null
  onToggle: (key: string) => void
  onRemove: () => void
}

function WishCard({ item, species, pct, dDay, onToggle, onRemove }: WishCardProps) {
  const { t } = useTranslation()
  const flag = species ? experienceMatch(species.difficulty) : 'ok'
  const regulated = species?.filingStatus === 'regulated'
  const progressVariant = pct === 100 ? 'success' : 'primary'

  return (
    <li>
      <Card padding="lg">
        <Card.Body>
          <div className={styles.cardHead}>
            <div className={styles.identity}>
              <span className={styles.emoji} aria-hidden="true">
                {species?.heroEmoji ?? '🐾'}
              </span>
              <div className={styles.names}>
                <span className={styles.koreanName}>
                  {species?.koreanName ?? t('wishlist.unknownSpecies')}
                </span>
                {species?.scientificName && (
                  <span className={styles.scientificName}>{species.scientificName}</span>
                )}
              </div>
            </div>
            <button type="button" className={styles.removeButton} onClick={onRemove}>
              {t('wishlist.remove')}
            </button>
          </div>

          <div className={styles.badges}>
            <Badge variant={PRIORITY_BADGE[item.priority]}>
              {t(`wishlist.priority.${item.priority}`)}
            </Badge>
            {species && (
              <Badge variant={DIFFICULTY_BADGE[species.difficulty]}>
                {t(`wishlist.difficulty.${species.difficulty}`)}
              </Badge>
            )}
            {regulated && (
              <Link to="/registry" className={styles.regulatedLink}>
                <Badge variant="error">{t('wishlist.regulatedWarning')}</Badge>
              </Link>
            )}
            {dDay && (
              <span className={`${styles.dday} ${styles[`dday-${dDay.tone}`]}`}>{dDay.text}</span>
            )}
          </div>

          {species && (
            <p className={styles.budgetHint}>
              {t('wishlist.budgetHint', { amount: KRW.format(species.monthlyBudgetKrw) })}
            </p>
          )}

          {flag === 'caution' && (
            <p className={styles.cautionNote}>{t('wishlist.experienceCaution')}</p>
          )}

          <div className={styles.readinessBlock}>
            <div className={styles.readinessHead}>
              <span className={styles.readinessTitle}>{t('wishlist.readinessTitle')}</span>
              <span className={styles.readinessPct}>{pct}%</span>
            </div>
            <Progress
              value={pct}
              variant={progressVariant}
              label={t('wishlist.readinessAria', { pct })}
            />
            <ul className={styles.readinessList}>
              {READINESS_ITEMS.map((key) => (
                <li key={key} className={styles.readinessItem}>
                  <Switch
                    size="sm"
                    checked={Boolean(item.readiness[key])}
                    onChange={() => onToggle(key)}
                    label={t(`wishlist.readiness.${key}`)}
                  />
                </li>
              ))}
            </ul>
          </div>

          {item.notes && <p className={styles.notes}>{item.notes}</p>}
        </Card.Body>
      </Card>
    </li>
  )
}

export default Wishlist
