import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  FORUM_SORT_OPTIONS,
  forumPostFormSchema,
  forumReplyFormSchema,
  hotScore,
  useForumStore,
  type ForumPost,
  type ForumPostFormValues,
  type ForumReply,
  type ForumReplyFormValues,
  type ForumSort,
} from '@features/forum'
import { useOnboardingStore } from '@features/onboarding'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import styles from './Forum.module.css'

function Forum() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('forum.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const posts = useForumStore((s) => s.posts)
  const repliesMap = useForumStore((s) => s.replies)
  const likedPostIds = useForumStore((s) => s.likedPostIds)
  const addPost = useForumStore((s) => s.addPost)
  const addReply = useForumStore((s) => s.addReply)
  const toggleLike = useForumStore((s) => s.toggleLike)
  const recordView = useForumStore((s) => s.recordView)

  const [category, setCategory] = useState<SpeciesCategory | 'all'>(profile.category ?? 'all')
  const [sort, setSort] = useState<ForumSort>('hot')
  const [search, setSearch] = useState('')
  const [openPostId, setOpenPostId] = useState<string | null>(null)

  const visiblePosts = selectPosts(posts, repliesMap, category, sort, search)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForumPostFormValues>({
    resolver: zodResolver(forumPostFormSchema),
    defaultValues: {
      category: profile.category ?? 'reptile',
      author: '',
      title: '',
      body: '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    addPost(values)
    toast(t('forum.postedToast'), 'success')
    reset({ category: values.category, author: values.author, title: '', body: '' })
  })

  function handleToggleOpen(postId: string) {
    const willOpen = openPostId !== postId
    setOpenPostId(willOpen ? postId : null)
    if (willOpen) recordView(postId)
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('forum.title')}</h1>
        <p className={styles.subtitle}>{t('forum.subtitle')}</p>
      </header>

      <div className={styles.controls}>
        <Input
          type="search"
          aria-label={t('forum.searchLabel')}
          placeholder={t('forum.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          aria-label={t('forum.sortLabel')}
          value={sort}
          onChange={(e) => setSort(e.target.value as ForumSort)}
          options={FORUM_SORT_OPTIONS.map((s) => ({
            value: s,
            label: t(`forum.sort.${s}`),
          }))}
        />
      </div>

      <div role="radiogroup" aria-label={t('forum.filterLabel')} className={styles.filters}>
        <button
          type="button"
          role="radio"
          aria-checked={category === 'all'}
          className={[styles.filterChip, category === 'all' ? styles.filterActive : ''].join(' ')}
          onClick={() => setCategory('all')}
        >
          {t('forum.filterAll')}
        </button>
        {SPECIES_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={category === c}
            className={[styles.filterChip, category === c ? styles.filterActive : ''].join(' ')}
            onClick={() => setCategory(c)}
          >
            {t(`categories.${c}`)}
          </button>
        ))}
      </div>

      <Card padding="lg" className={styles.composerCard}>
        <Card.Body>
          <h2 className={styles.composerTitle}>{t('forum.newPostTitle')}</h2>
          <form onSubmit={onSubmit} className={styles.composerForm} noValidate>
            <div className={styles.composerRow}>
              <Select
                label={t('forum.category')}
                options={SPECIES_CATEGORIES.map((c) => ({
                  value: c,
                  label: t(`categories.${c}`),
                }))}
                {...register('category')}
              />
              <Input
                label={t('forum.author')}
                placeholder={t('forum.authorPlaceholder')}
                error={errors.author?.message ? t(errors.author.message) : undefined}
                {...register('author')}
              />
            </div>
            <Input
              label={t('forum.titleLabel')}
              placeholder={t('forum.titlePlaceholder')}
              error={errors.title?.message ? t(errors.title.message) : undefined}
              {...register('title')}
            />
            <Textarea
              label={t('forum.bodyLabel')}
              rows={3}
              placeholder={t('forum.bodyPlaceholder')}
              error={errors.body?.message ? t(errors.body.message) : undefined}
              {...register('body')}
            />
            <div className={styles.composerActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('forum.publish')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {visiblePosts.length === 0 && (
        <EmptyState
          icon="💬"
          title={search ? t('forum.noResult') : t('forum.empty')}
          description={search ? t('forum.noResultHint') : undefined}
        />
      )}

      <ul className={styles.list}>
        {visiblePosts.map((post) => {
          const replies = repliesMap[post.id] ?? []
          const isOpen = openPostId === post.id
          const liked = Boolean(likedPostIds[post.id])
          return (
            <li key={post.id}>
              <Card padding="lg" className={styles.postCard}>
                <Card.Body>
                  <div className={styles.postHeader}>
                    <div>
                      <h3 className={styles.postTitle}>{post.title}</h3>
                      <p className={styles.postMeta}>
                        <Badge variant="primary">{t(`categories.${post.category}`)}</Badge>{' '}
                        {post.author} · {new Date(post.createdAt).toLocaleString('ko')}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.toggleButton}
                      onClick={() => handleToggleOpen(post.id)}
                    >
                      {isOpen ? t('forum.collapse') : t('forum.expand')}
                    </button>
                  </div>
                  <p className={styles.postBody}>{post.body}</p>

                  <div className={styles.postStats}>
                    <button
                      type="button"
                      className={[styles.likeButton, liked ? styles.likeButtonLiked : ''].join(' ')}
                      aria-pressed={liked}
                      aria-label={liked ? t('forum.unlike') : t('forum.like')}
                      onClick={() => toggleLike(post.id)}
                    >
                      <span aria-hidden="true">{liked ? '❤️' : '🤍'}</span> {post.likes}
                    </button>
                    <span className={styles.statChip}>
                      <span aria-hidden="true">💬</span> {replies.length}
                    </span>
                    <span className={styles.statChip}>
                      <span aria-hidden="true">👁️</span> {post.views}
                    </span>
                  </div>

                  {isOpen && (
                    <ReplyThread
                      replies={replies}
                      onSend={(values) => {
                        addReply({ postId: post.id, ...values })
                        toast(t('forum.replyToast'), 'success')
                      }}
                    />
                  )}
                </Card.Body>
              </Card>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function selectPosts(
  posts: ForumPost[],
  repliesMap: Record<string, ForumReply[]>,
  category: SpeciesCategory | 'all',
  sort: ForumSort,
  search: string
): ForumPost[] {
  const now = Date.now()
  const needle = search.trim().toLowerCase()
  const filtered = posts.filter((p) => {
    if (category !== 'all' && p.category !== category) return false
    if (!needle) return true
    return p.title.toLowerCase().includes(needle) || p.body.toLowerCase().includes(needle)
  })
  return filtered.sort((a, b) => {
    if (sort === 'recent') return b.createdAt.localeCompare(a.createdAt)
    if (sort === 'popular') return b.likes - a.likes
    if (sort === 'views') return b.views - a.views
    const aScore = hotScore(
      {
        likes: a.likes,
        views: a.views,
        replies: repliesMap[a.id]?.length ?? 0,
        createdAt: a.createdAt,
      },
      now
    )
    const bScore = hotScore(
      {
        likes: b.likes,
        views: b.views,
        replies: repliesMap[b.id]?.length ?? 0,
        createdAt: b.createdAt,
      },
      now
    )
    return bScore - aScore
  })
}

interface ReplyThreadProps {
  replies: ReturnType<typeof useForumStore.getState>['replies'][string]
  onSend: (values: ForumReplyFormValues) => void
}

function ReplyThread({ replies, onSend }: ReplyThreadProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForumReplyFormValues>({
    resolver: zodResolver(forumReplyFormSchema),
    defaultValues: { author: '', body: '' },
  })

  const submit = handleSubmit((values) => {
    onSend(values)
    reset({ author: values.author, body: '' })
  })

  return (
    <div className={styles.replyThread}>
      <h4 className={styles.replyTitle}>
        {t('forum.repliesCount', { count: replies?.length ?? 0 })}
      </h4>
      <ul className={styles.replyList}>
        {(replies ?? []).map((reply) => (
          <li key={reply.id} className={styles.replyItem}>
            <p className={styles.replyMeta}>
              <strong>{reply.author}</strong> · {new Date(reply.createdAt).toLocaleString('ko')}
            </p>
            <p className={styles.replyBody}>{reply.body}</p>
          </li>
        ))}
      </ul>
      <form className={styles.replyForm} onSubmit={submit} noValidate>
        <Input
          label={t('forum.author')}
          placeholder={t('forum.authorPlaceholder')}
          error={errors.author?.message ? t(errors.author.message) : undefined}
          {...register('author')}
        />
        <Textarea
          rows={2}
          label={t('forum.replyLabel')}
          placeholder={t('forum.replyPlaceholder')}
          error={errors.body?.message ? t(errors.body.message) : undefined}
          {...register('body')}
        />
        <Button type="submit" variant="outline" isLoading={isSubmitting}>
          {t('forum.reply')}
        </Button>
      </form>
    </div>
  )
}

export default Forum
