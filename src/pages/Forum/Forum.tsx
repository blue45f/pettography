import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  buildReplyTree,
  FORUM_MAX_REPLY_DEPTH,
  FORUM_SORT_OPTIONS,
  forumPostFormSchema,
  forumReplyFormSchema,
  hotScore,
  useForumStore,
  type ForumPost,
  type ForumPostFormValues,
  type ForumReply,
  type ForumReplyFormValues,
  type ForumReplyNode,
  type ForumSort,
} from '@features/forum'
import { useOnboardingStore } from '@features/onboarding'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect, useState } from 'react'
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
  const ownPostIds = useForumStore((s) => s.ownPostIds)
  const ownReplyIds = useForumStore((s) => s.ownReplyIds)
  const reportedPostIds = useForumStore((s) => s.reportedPostIds)
  const reportedReplyIds = useForumStore((s) => s.reportedReplyIds)
  const addPost = useForumStore((s) => s.addPost)
  const addReply = useForumStore((s) => s.addReply)
  const toggleLike = useForumStore((s) => s.toggleLike)
  const recordView = useForumStore((s) => s.recordView)
  const removePost = useForumStore((s) => s.removePost)
  const removeReply = useForumStore((s) => s.removeReply)
  const reportPost = useForumStore((s) => s.reportPost)
  const reportReply = useForumStore((s) => s.reportReply)
  const lastAuthor = useForumStore((s) => s.lastAuthor)

  const [category, setCategory] = useState<SpeciesCategory | 'all'>(profile.category ?? 'all')
  const [sort, setSort] = useState<ForumSort>('hot')
  const [search, setSearch] = useState('')
  const [openPostId, setOpenPostId] = useState<string | null>(null)

  const visiblePosts = selectPosts(posts, repliesMap, ownPostIds, category, sort, search)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ForumPostFormValues>({
    resolver: zodResolver(forumPostFormSchema),
    defaultValues: {
      category: profile.category ?? 'reptile',
      author: lastAuthor,
      title: '',
      body: '',
    },
  })

  useEffect(() => {
    if (!dirtyFields.author) setValue('author', lastAuthor)
  }, [lastAuthor, dirtyFields.author, setValue])

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
                    <div className={styles.postAuthorActions}>
                      {ownPostIds[post.id] ? (
                        <button
                          type="button"
                          className={styles.dangerLink}
                          onClick={() => {
                            removePost(post.id)
                            toast(t('forum.deletedToast'), 'success')
                          }}
                        >
                          {t('forum.delete')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.ghostLink}
                          disabled={Boolean(reportedPostIds[post.id])}
                          onClick={() => {
                            const ok = reportPost(post.id)
                            toast(
                              ok ? t('forum.reportedToast') : t('forum.reportedAlready'),
                              ok ? 'success' : 'error'
                            )
                          }}
                        >
                          {reportedPostIds[post.id] ? t('forum.reported') : t('forum.report')}
                        </button>
                      )}
                    </div>
                  </div>

                  {post.autoHidden && ownPostIds[post.id] && (
                    <p className={styles.hiddenNotice}>{t('forum.hiddenNotice')}</p>
                  )}

                  {isOpen && (
                    <ReplyThread
                      postId={post.id}
                      replies={replies}
                      ownReplyIds={ownReplyIds}
                      reportedReplyIds={reportedReplyIds}
                      lastAuthor={lastAuthor}
                      onSend={(values, parentReplyId) => {
                        addReply({ postId: post.id, parentReplyId, ...values })
                        toast(t('forum.replyToast'), 'success')
                      }}
                      onRemove={(replyId) => {
                        removeReply(post.id, replyId)
                        toast(t('forum.deletedToast'), 'success')
                      }}
                      onReport={(replyId) => {
                        const ok = reportReply(post.id, replyId)
                        toast(
                          ok ? t('forum.reportedToast') : t('forum.reportedAlready'),
                          ok ? 'success' : 'error'
                        )
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
  ownPostIds: Record<string, true>,
  category: SpeciesCategory | 'all',
  sort: ForumSort,
  search: string
): ForumPost[] {
  const now = Date.now()
  const needle = search.trim().toLowerCase()
  const filtered = posts.filter((p) => {
    if (p.autoHidden && !ownPostIds[p.id]) return false
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

type ReplySender = (values: ForumReplyFormValues, parentReplyId: string | null) => void

interface ReplyThreadProps {
  postId: string
  replies: readonly ForumReply[]
  ownReplyIds: Record<string, true>
  reportedReplyIds: Record<string, true>
  lastAuthor: string
  onSend: ReplySender
  onRemove: (replyId: string) => void
  onReport: (replyId: string) => void
}

function ReplyThread({
  replies,
  ownReplyIds,
  reportedReplyIds,
  lastAuthor,
  onSend,
  onRemove,
  onReport,
}: ReplyThreadProps) {
  const { t } = useTranslation()
  const tree = buildReplyTree(replies)

  return (
    <div className={styles.replyThread}>
      <h4 className={styles.replyTitle}>
        {t('forum.repliesCount', { count: replies?.length ?? 0 })}
      </h4>
      {tree.length > 0 && (
        <ul className={styles.replyList}>
          {tree.map((node) => (
            <ReplyNode
              key={node.reply.id}
              node={node}
              depth={0}
              ownReplyIds={ownReplyIds}
              reportedReplyIds={reportedReplyIds}
              lastAuthor={lastAuthor}
              onSend={onSend}
              onRemove={onRemove}
              onReport={onReport}
            />
          ))}
        </ul>
      )}
      <ReplyComposer
        onSubmit={(values) => onSend(values, null)}
        variant="root"
        lastAuthor={lastAuthor}
      />
    </div>
  )
}

interface ReplyNodeProps {
  node: ForumReplyNode
  depth: number
  ownReplyIds: Record<string, true>
  reportedReplyIds: Record<string, true>
  lastAuthor: string
  onSend: ReplySender
  onRemove: (replyId: string) => void
  onReport: (replyId: string) => void
}

function ReplyNode({
  node,
  depth,
  ownReplyIds,
  reportedReplyIds,
  lastAuthor,
  onSend,
  onRemove,
  onReport,
}: ReplyNodeProps) {
  const { t } = useTranslation()
  const [composerOpen, setComposerOpen] = useState(false)
  const canReply = depth + 1 < FORUM_MAX_REPLY_DEPTH
  const owned = Boolean(ownReplyIds[node.reply.id])
  const reported = Boolean(reportedReplyIds[node.reply.id])

  return (
    <li className={styles.replyItem}>
      <p className={styles.replyMeta}>
        <strong>{node.reply.author}</strong> · {new Date(node.reply.createdAt).toLocaleString('ko')}
      </p>
      <p className={styles.replyBody}>{node.reply.body}</p>
      <div className={styles.replyActions}>
        {canReply && (
          <button
            type="button"
            className={styles.replyNodeAction}
            onClick={() => setComposerOpen((prev) => !prev)}
            aria-expanded={composerOpen}
          >
            {composerOpen ? t('forum.cancelReply') : t('forum.replyToThis')}
          </button>
        )}
        {owned ? (
          <button
            type="button"
            className={styles.dangerLink}
            onClick={() => onRemove(node.reply.id)}
          >
            {t('forum.delete')}
          </button>
        ) : (
          <button
            type="button"
            className={styles.ghostLink}
            disabled={reported}
            onClick={() => onReport(node.reply.id)}
          >
            {reported ? t('forum.reported') : t('forum.report')}
          </button>
        )}
      </div>
      {composerOpen && canReply && (
        <ReplyComposer
          variant="nested"
          lastAuthor={lastAuthor}
          onSubmit={(values) => {
            onSend(values, node.reply.id)
            setComposerOpen(false)
          }}
        />
      )}
      {node.children.length > 0 && (
        <ul className={styles.replyChildren}>
          {node.children.map((child) => (
            <ReplyNode
              key={child.reply.id}
              node={child}
              depth={depth + 1}
              ownReplyIds={ownReplyIds}
              reportedReplyIds={reportedReplyIds}
              lastAuthor={lastAuthor}
              onSend={onSend}
              onRemove={onRemove}
              onReport={onReport}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

interface ReplyComposerProps {
  variant: 'root' | 'nested'
  lastAuthor: string
  onSubmit: (values: ForumReplyFormValues) => void
}

function ReplyComposer({ variant, lastAuthor, onSubmit }: ReplyComposerProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForumReplyFormValues>({
    resolver: zodResolver(forumReplyFormSchema),
    defaultValues: { author: lastAuthor, body: '' },
  })

  const submit = handleSubmit((values) => {
    onSubmit(values)
    reset({ author: values.author, body: '' })
  })

  return (
    <form
      className={variant === 'nested' ? styles.replyFormNested : styles.replyForm}
      onSubmit={submit}
      noValidate
    >
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
      <Button type="submit" variant="outline" size="sm" isLoading={isSubmitting}>
        {t('forum.reply')}
      </Button>
    </form>
  )
}

export default Forum
