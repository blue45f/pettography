import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import LazyImage from '@components/common/LazyImage'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import { useOnboardingStore } from '@features/onboarding'
import {
  CONTEST_THEMES,
  CURRENT_THEME_ID,
  SEED_POSTS,
  SHOWCASE_SORT_OPTIONS,
  showcaseFormSchema,
  topPostForTheme,
  useShowcaseStore,
  voteCount,
  type ShowcaseFormValues,
  type ShowcasePost,
  type ShowcaseSort,
  type ShowcaseThemeId,
} from '@features/showcase'
import { useSpeciesList, type Species } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Showcase.module.css'

type ThemeFilter = ShowcaseThemeId | 'all'

function Showcase() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('showcase.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const { data: speciesList = [] } = useSpeciesList({})

  const posts = useShowcaseStore((s) => s.posts)
  const votedIds = useShowcaseStore((s) => s.votedIds)
  const ownIds = useShowcaseStore((s) => s.ownIds)
  const lastAuthor = useShowcaseStore((s) => s.lastAuthor)
  const hydrateSeed = useShowcaseStore((s) => s.hydrateSeed)
  const addPost = useShowcaseStore((s) => s.addPost)
  const removePost = useShowcaseStore((s) => s.removePost)
  const toggleVote = useShowcaseStore((s) => s.toggleVote)

  // Seed once on mount via a lazy initializer — never setState in an effect.
  useState(() => {
    hydrateSeed(SEED_POSTS)
    return true
  })

  const [filter, setFilter] = useState<ThemeFilter>('all')
  const [sort, setSort] = useState<ShowcaseSort>('popular')

  const speciesById = useMemo(() => {
    const map = new Map<string, Species>()
    for (const sp of speciesList) map.set(sp.id, sp)
    return map
  }, [speciesList])

  const currentTheme = CONTEST_THEMES.find((th) => th.id === CURRENT_THEME_ID)
  const winner = topPostForTheme(posts, votedIds, CURRENT_THEME_ID)

  const visiblePosts = useMemo(() => {
    const filtered = posts.filter((p) => filter === 'all' || p.themeId === filter)
    return [...filtered].sort((a, b) => {
      if (sort === 'recent') return b.createdAt.localeCompare(a.createdAt)
      const diff = voteCount(b, votedIds) - voteCount(a, votedIds)
      return diff !== 0 ? diff : b.createdAt.localeCompare(a.createdAt)
    })
  }, [posts, filter, sort, votedIds])

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('showcase.title')}</h1>
        <p className={styles.subtitle}>{t('showcase.subtitle')}</p>
      </header>

      {currentTheme && (
        <div className={styles.themeBanner}>
          <span className={styles.themeEmoji} aria-hidden="true">
            {currentTheme.emoji}
          </span>
          <div className={styles.themeText}>
            <p className={styles.themeLabel}>{t('showcase.banner.eyebrow')}</p>
            <h2 className={styles.themeName}>{t(`showcase.themes.${currentTheme.id}.name`)}</h2>
            <p className={styles.themeTagline}>{t(`showcase.themes.${currentTheme.id}.tagline`)}</p>
          </div>
        </div>
      )}

      {winner && (
        <Card padding="lg" className={styles.winnerCard}>
          <Card.Body>
            <div className={styles.winnerHead}>
              <Badge variant="warning">{t('showcase.winnerBadge')}</Badge>
              <span className={styles.winnerVotes}>
                {t('showcase.voteCount', { count: voteCount(winner, votedIds) })}
              </span>
            </div>
            <div className={styles.winnerBody}>
              <LazyImage
                src={winner.imageUrl}
                alt={winner.caption || t('showcase.photoAlt', { author: winner.author })}
                className={styles.winnerImage}
                hoverZoom
              />
              <div className={styles.winnerMeta}>
                <p className={styles.winnerCaption}>{winner.caption}</p>
                <p className={styles.winnerAuthor}>
                  {speciesEmoji(winner, speciesById)} {winner.author}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      <div role="radiogroup" aria-label={t('showcase.filterLabel')} className={styles.filters}>
        <button
          type="button"
          role="radio"
          aria-checked={filter === 'all'}
          className={[styles.filterChip, filter === 'all' ? styles.filterActive : ''].join(' ')}
          onClick={() => setFilter('all')}
        >
          {t('showcase.filterAll')}
        </button>
        {CONTEST_THEMES.map((th) => (
          <button
            key={th.id}
            type="button"
            role="radio"
            aria-checked={filter === th.id}
            className={[styles.filterChip, filter === th.id ? styles.filterActive : ''].join(' ')}
            onClick={() => setFilter(th.id)}
          >
            <span aria-hidden="true">{th.emoji}</span> {t(`showcase.themes.${th.id}.name`)}
          </button>
        ))}
      </div>

      <div className={styles.controls}>
        <Select
          aria-label={t('showcase.sortLabel')}
          value={sort}
          onChange={(e) => setSort(e.target.value as ShowcaseSort)}
          options={SHOWCASE_SORT_OPTIONS.map((s) => ({
            value: s,
            label: t(`showcase.sort.${s}`),
          }))}
        />
      </div>

      <SubmitForm
        lastAuthor={lastAuthor}
        defaultThemeId={filter === 'all' ? CURRENT_THEME_ID : filter}
        onSubmit={(values) => {
          addPost({ ...values, speciesId: profile.speciesId ?? null })
          toast(t('showcase.postedToast'), 'success')
        }}
      />

      {visiblePosts.length === 0 ? (
        <EmptyState icon="📷" title={t('showcase.empty')} description={t('showcase.emptyHint')} />
      ) : (
        <ul className={styles.grid}>
          {visiblePosts.map((post, index) => {
            const voted = Boolean(votedIds[post.id])
            const owned = Boolean(ownIds[post.id])
            // Editorial rhythm: the leading photo runs as a wide hero tile, then
            // every fifth tile takes a taller portrait span so the masonry never
            // settles into a uniform grid (DESIGN.md: vary affordance by weight).
            const isLead = index === 0
            const isTall = !isLead && index % 5 === 2
            const tileClass = [
              styles.tile,
              isLead ? styles.tileLead : '',
              isTall ? styles.tileTall : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <li key={post.id} className={tileClass}>
                <figure className={styles.figure}>
                  <LazyImage
                    src={post.imageUrl}
                    alt={post.caption || t('showcase.photoAlt', { author: post.author })}
                    className={styles.photo}
                    hoverZoom
                  />
                  <figcaption className={styles.scrim}>
                    <span className={styles.themeChip}>
                      <span aria-hidden="true">{themeEmoji(post.themeId)}</span>{' '}
                      {t(`showcase.themes.${post.themeId}.name`)}
                    </span>
                    {post.caption && <p className={styles.caption}>{post.caption}</p>}
                    <p className={styles.author}>
                      <span aria-hidden="true">{speciesEmoji(post, speciesById)}</span>{' '}
                      {post.author}
                    </p>
                  </figcaption>
                </figure>
                <div className={styles.tileActions}>
                  <button
                    type="button"
                    className={[styles.voteButton, voted ? styles.voteButtonOn : ''].join(' ')}
                    aria-pressed={voted}
                    aria-label={voted ? t('showcase.unvote') : t('showcase.vote')}
                    onClick={() => toggleVote(post.id)}
                  >
                    <span aria-hidden="true">{voted ? '♥' : '♡'}</span> {voteCount(post, votedIds)}
                  </button>
                  {owned && (
                    <button
                      type="button"
                      className={styles.removeLink}
                      onClick={() => {
                        removePost(post.id)
                        toast(t('showcase.deletedToast'), 'success')
                      }}
                    >
                      {t('showcase.delete')}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function themeEmoji(themeId: ShowcaseThemeId): string {
  return CONTEST_THEMES.find((th) => th.id === themeId)?.emoji ?? '📷'
}

function speciesEmoji(post: ShowcasePost, speciesById: Map<string, Species>): string {
  if (!post.speciesId) return '🐾'
  return speciesById.get(post.speciesId)?.heroEmoji ?? '🐾'
}

interface SubmitFormProps {
  lastAuthor: string
  defaultThemeId: ShowcaseThemeId
  onSubmit: (values: ShowcaseFormValues) => void
}

function SubmitForm({ lastAuthor, defaultThemeId, onSubmit }: SubmitFormProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ShowcaseFormValues>({
    resolver: zodResolver(showcaseFormSchema),
    defaultValues: {
      author: lastAuthor,
      imageUrl: '',
      caption: '',
      themeId: defaultThemeId,
    },
  })

  useEffect(() => {
    if (!dirtyFields.author) setValue('author', lastAuthor)
  }, [lastAuthor, dirtyFields.author, setValue])

  const submit = handleSubmit((values) => {
    onSubmit(values)
    reset({ author: values.author, imageUrl: '', caption: '', themeId: values.themeId })
  })

  return (
    <Card padding="lg" className={styles.composerCard}>
      <Card.Body>
        <h2 className={styles.composerTitle}>{t('showcase.newPostTitle')}</h2>
        <p className={styles.composerHint}>{t('showcase.newPostHint')}</p>
        <form onSubmit={submit} className={styles.composerForm} noValidate>
          <div className={styles.composerRow}>
            <Input
              label={t('showcase.author')}
              placeholder={t('showcase.authorPlaceholder')}
              error={errors.author?.message ? t(errors.author.message) : undefined}
              {...register('author')}
            />
            <Select
              label={t('showcase.theme')}
              options={CONTEST_THEMES.map((th) => ({
                value: th.id,
                label: `${th.emoji} ${t(`showcase.themes.${th.id}.name`)}`,
              }))}
              {...register('themeId')}
            />
          </div>
          <Input
            label={t('showcase.imageUrl')}
            placeholder={t('showcase.imageUrlPlaceholder')}
            error={errors.imageUrl?.message ? t(errors.imageUrl.message) : undefined}
            {...register('imageUrl')}
          />
          <Textarea
            label={t('showcase.caption')}
            rows={2}
            placeholder={t('showcase.captionPlaceholder')}
            error={errors.caption?.message ? t(errors.caption.message) : undefined}
            {...register('caption')}
          />
          <div className={styles.composerActions}>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t('showcase.publish')}
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}

export default Showcase
