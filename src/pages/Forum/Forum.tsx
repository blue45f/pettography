import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  forumPostFormSchema,
  forumReplyFormSchema,
  useForumStore,
  type ForumPostFormValues,
  type ForumReplyFormValues,
} from '@features/forum'
import { useOnboardingStore } from '@features/onboarding'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@features/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
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
  const addPost = useForumStore((s) => s.addPost)
  const addReply = useForumStore((s) => s.addReply)

  const [category, setCategory] = useState<SpeciesCategory | 'all'>(profile.category ?? 'all')
  const [openPostId, setOpenPostId] = useState<string | null>(null)

  const visiblePosts = useMemo(
    () =>
      posts
        .filter((p) => (category === 'all' ? true : p.category === category))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [posts, category]
  )

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

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('forum.title')}</h1>
        <p className={styles.subtitle}>{t('forum.subtitle')}</p>
      </header>

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

      {visiblePosts.length === 0 && <EmptyState icon="💬" title={t('forum.empty')} />}

      <ul className={styles.list}>
        {visiblePosts.map((post) => {
          const replies = repliesMap[post.id] ?? []
          const isOpen = openPostId === post.id
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
                      onClick={() => setOpenPostId(isOpen ? null : post.id)}
                    >
                      {isOpen ? t('forum.collapse') : t('forum.expand')}
                    </button>
                  </div>
                  <p className={styles.postBody}>{post.body}</p>
                  {isOpen && (
                    <ReplyThread
                      postId={post.id}
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

interface ReplyThreadProps {
  postId: string
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
