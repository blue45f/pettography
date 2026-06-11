import AttachmentGallery from '@components/common/AttachmentGallery'
import AttachmentPicker from '@components/common/AttachmentPicker'
import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  buildCommentThreads,
  cafeCommentFormSchema,
  cafeMemberCount,
  cafePostFormSchema,
  useCafesStore,
  type CafeComment,
  type CafeCommentFormValues,
  type CafePost,
  type CafePostFormValues,
} from '@features/cafes'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import styles from './CafeDetail.module.css'

import type { Attachment } from '@features/attachments'

function CafeDetail() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { cafeId } = useParams<{ cafeId: string }>()

  const cafe = useCafesStore((s) => s.cafes.find((c) => c.id === cafeId))
  const posts = useCafesStore((s) => (cafeId ? (s.posts[cafeId] ?? []) : []))
  const commentsMap = useCafesStore((s) => s.comments)
  const joinedCafeIds = useCafesStore((s) => s.joinedCafeIds)
  const ownCafeIds = useCafesStore((s) => s.ownCafeIds)
  const ownPostIds = useCafesStore((s) => s.ownPostIds)
  const ownCommentIds = useCafesStore((s) => s.ownCommentIds)
  const lastNickname = useCafesStore((s) => s.lastNickname)
  const joinCafe = useCafesStore((s) => s.joinCafe)
  const leaveCafe = useCafesStore((s) => s.leaveCafe)
  const addPost = useCafesStore((s) => s.addPost)
  const removePost = useCafesStore((s) => s.removePost)
  const addComment = useCafesStore((s) => s.addComment)
  const removeComment = useCafesStore((s) => s.removeComment)

  useDocumentTitle(cafe ? cafe.name : t('cafes.notFound'))

  if (!cafe || cafe.archivedByAdmin) {
    return (
      <section className={styles.page}>
        <EmptyState
          variant="gated"
          icon="☕"
          title={t('cafes.notFound')}
          description={t('cafes.notFoundDesc')}
          action={
            <Link to="/cafes" className={styles.backCta}>
              {t('cafes.backToList')}
            </Link>
          }
        />
      </section>
    )
  }

  const isJoined = Boolean(joinedCafeIds[cafe.id])
  const visiblePosts = posts.filter((p) => !p.hiddenByAdmin || ownPostIds[p.id])

  function handleMembership() {
    if (isJoined) {
      leaveCafe(cafe!.id)
      toast(t('cafes.leftToast'), 'info')
    } else {
      joinCafe(cafe!.id)
      toast(t('cafes.joinedToast'), 'success')
    }
  }

  return (
    <section className={styles.page}>
      <p className={styles.backRow}>
        <Link to="/cafes" className={styles.backLink}>
          ← {t('cafes.backToList')}
        </Link>
      </p>

      <Card padding="lg" className={styles.heroCard}>
        <Card.Body>
          <div className={styles.heroRow}>
            <span className={styles.heroEmoji} aria-hidden="true">
              {cafe.emoji}
            </span>
            <div className={styles.heroMeta}>
              <div className={styles.heroTitleRow}>
                <h1 className={styles.heroTitle}>{cafe.name}</h1>
                {ownCafeIds[cafe.id] && <Badge variant="primary">{t('cafes.hostBadge')}</Badge>}
              </div>
              <p className={styles.heroDesc}>{cafe.description}</p>
              <p className={styles.heroStats}>
                <Badge variant="default">{t(`categories.${cafe.category}`)}</Badge>{' '}
                <Link to={`/species/${cafe.speciesId}`} className={styles.speciesLink}>
                  {cafe.speciesName}
                </Link>{' '}
                · {t('cafes.members', { count: cafeMemberCount(cafe, isJoined) })} ·{' '}
                {t('cafes.hostLine', { name: cafe.createdBy })}
              </p>
            </div>
            <Button
              type="button"
              variant={isJoined ? 'outline' : 'primary'}
              onClick={handleMembership}
            >
              {isJoined ? t('cafes.leave') : t('cafes.join')}
            </Button>
          </div>
        </Card.Body>
      </Card>

      <section aria-labelledby="cafe-board-heading" className={styles.board}>
        <h2 id="cafe-board-heading" className={styles.boardTitle}>
          {t('cafes.boardTitle')}
        </h2>

        {isJoined ? (
          <PostComposer
            lastNickname={lastNickname}
            onSubmit={(values, attachments) => {
              addPost({ cafeId: cafe.id, ...values, attachments })
              toast(t('cafes.postedToast'), 'success')
            }}
          />
        ) : (
          <EmptyState
            variant="gated"
            icon="🔑"
            title={t('cafes.joinFirstTitle')}
            hint={t('cafes.joinFirstHint')}
            action={
              <Button type="button" variant="primary" onClick={handleMembership}>
                {t('cafes.join')}
              </Button>
            }
          />
        )}

        {visiblePosts.length === 0 && (
          <EmptyState
            icon="📝"
            title={t('cafes.emptyBoardTitle')}
            description={t('cafes.emptyBoardDesc')}
          />
        )}

        <ul className={styles.postList}>
          {visiblePosts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              comments={commentsMap[post.id] ?? []}
              canParticipate={isJoined}
              owned={Boolean(ownPostIds[post.id])}
              ownCommentIds={ownCommentIds}
              lastNickname={lastNickname}
              onRemovePost={() => {
                removePost(cafe.id, post.id)
                toast(t('cafes.deletedToast'), 'success')
              }}
              onAddComment={(values, parentCommentId) => {
                addComment({ postId: post.id, parentCommentId, ...values })
                toast(t('cafes.commentToast'), 'success')
              }}
              onRemoveComment={(commentId) => {
                removeComment(post.id, commentId)
                toast(t('cafes.deletedToast'), 'success')
              }}
            />
          ))}
        </ul>
      </section>
    </section>
  )
}

interface PostComposerProps {
  lastNickname: string
  onSubmit: (values: CafePostFormValues, attachments: Attachment[]) => void
}

function PostComposer({ lastNickname, onSubmit }: PostComposerProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [attachments, setAttachments] = useState<Attachment[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CafePostFormValues>({
    resolver: zodResolver(cafePostFormSchema),
    defaultValues: { title: '', author: lastNickname, body: '' },
  })

  const submit = handleSubmit((values) => {
    onSubmit(values, attachments)
    setAttachments([])
    reset({ title: '', author: values.author, body: '' })
  })

  return (
    <Card padding="lg" className={styles.composerCard}>
      <Card.Body>
        <h3 className={styles.composerTitle}>{t('cafes.newPostTitle')}</h3>
        <form onSubmit={submit} className={styles.composerForm} noValidate>
          <div className={styles.composerRow}>
            <Input
              label={t('cafes.postTitleLabel')}
              placeholder={t('cafes.postTitlePlaceholder')}
              error={errors.title?.message ? t(errors.title.message) : undefined}
              {...register('title')}
            />
            <Input
              label={t('cafes.nicknameLabel')}
              placeholder={t('cafes.nicknamePlaceholder')}
              error={errors.author?.message ? t(errors.author.message) : undefined}
              {...register('author')}
            />
          </div>
          <Textarea
            rows={3}
            label={t('cafes.postBodyLabel')}
            placeholder={t('cafes.postBodyPlaceholder')}
            error={errors.body?.message ? t(errors.body.message) : undefined}
            {...register('body')}
          />
          <AttachmentPicker
            attachments={attachments}
            onChange={setAttachments}
            onError={(message) => toast(message, 'error')}
          />
          <div className={styles.composerActions}>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t('cafes.publish')}
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}

interface PostItemProps {
  post: CafePost
  comments: CafeComment[]
  canParticipate: boolean
  owned: boolean
  ownCommentIds: Record<string, true>
  lastNickname: string
  onRemovePost: () => void
  onAddComment: (values: CafeCommentFormValues, parentCommentId: string | null) => void
  onRemoveComment: (commentId: string) => void
}

function PostItem({
  post,
  comments,
  canParticipate,
  owned,
  ownCommentIds,
  lastNickname,
  onRemovePost,
  onAddComment,
  onRemoveComment,
}: PostItemProps) {
  const { t } = useTranslation()
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [replyTarget, setReplyTarget] = useState<string | null>(null)
  const threads = buildCommentThreads(comments)
  const commentCount = comments.filter((c) => !c.deleted).length

  return (
    <li>
      <Card padding="lg" className={styles.postCard}>
        <Card.Body>
          <div className={styles.postHeader}>
            <div>
              <h3 className={styles.postTitle}>{post.title}</h3>
              <p className={styles.postMeta}>
                {post.author} · {new Date(post.createdAt).toLocaleString('ko')}
              </p>
            </div>
            {owned && (
              <button type="button" className={styles.dangerLink} onClick={onRemovePost}>
                {t('cafes.delete')}
              </button>
            )}
          </div>
          {post.hiddenByAdmin && (
            <p className={styles.hiddenNotice}>{t('cafes.adminHiddenNotice')}</p>
          )}
          <p className={styles.postBody}>{post.body}</p>
          <AttachmentGallery attachments={post.attachments} />

          <button
            type="button"
            className={styles.commentToggle}
            aria-expanded={commentsOpen}
            onClick={() => setCommentsOpen((prev) => !prev)}
          >
            💬 {t('cafes.comments', { count: commentCount })}
          </button>

          {commentsOpen && (
            <div className={styles.commentArea}>
              {threads.length > 0 && (
                <ul className={styles.commentList}>
                  {threads.map((thread) => (
                    <li key={thread.comment.id} className={styles.commentItem}>
                      <CommentBody
                        comment={thread.comment}
                        owned={Boolean(ownCommentIds[thread.comment.id])}
                        canReply={canParticipate}
                        isReplyTarget={replyTarget === thread.comment.id}
                        onToggleReply={() =>
                          setReplyTarget((prev) =>
                            prev === thread.comment.id ? null : thread.comment.id,
                          )
                        }
                        onRemove={() => onRemoveComment(thread.comment.id)}
                      />
                      {thread.children.length > 0 && (
                        <ul className={styles.commentChildren}>
                          {thread.children.map((child) => (
                            <li key={child.id} className={styles.commentItem}>
                              <CommentBody
                                comment={child}
                                owned={Boolean(ownCommentIds[child.id])}
                                canReply={false}
                                isReplyTarget={false}
                                onToggleReply={() => {}}
                                onRemove={() => onRemoveComment(child.id)}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                      {replyTarget === thread.comment.id && canParticipate && (
                        <CommentComposer
                          variant="nested"
                          lastNickname={lastNickname}
                          onSubmit={(values) => {
                            onAddComment(values, thread.comment.id)
                            setReplyTarget(null)
                          }}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canParticipate ? (
                <CommentComposer
                  variant="root"
                  lastNickname={lastNickname}
                  onSubmit={(values) => onAddComment(values, null)}
                />
              ) : (
                <p className={styles.joinHint}>{t('cafes.joinFirstHint')}</p>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </li>
  )
}

interface CommentBodyProps {
  comment: CafeComment
  owned: boolean
  canReply: boolean
  isReplyTarget: boolean
  onToggleReply: () => void
  onRemove: () => void
}

function CommentBody({
  comment,
  owned,
  canReply,
  isReplyTarget,
  onToggleReply,
  onRemove,
}: CommentBodyProps) {
  const { t } = useTranslation()

  if (comment.deleted) {
    return <p className={styles.deletedComment}>{t('cafes.deletedComment')}</p>
  }

  return (
    <div>
      <p className={styles.commentMeta}>
        <strong>{comment.author}</strong> · {new Date(comment.createdAt).toLocaleString('ko')}
      </p>
      <p className={styles.commentBody}>{comment.body}</p>
      <div className={styles.commentActions}>
        {canReply && (
          <button
            type="button"
            className={styles.commentAction}
            aria-expanded={isReplyTarget}
            onClick={onToggleReply}
          >
            {isReplyTarget ? t('cafes.cancelReply') : t('cafes.replyToThis')}
          </button>
        )}
        {owned && (
          <button type="button" className={styles.dangerLink} onClick={onRemove}>
            {t('cafes.delete')}
          </button>
        )}
      </div>
    </div>
  )
}

interface CommentComposerProps {
  variant: 'root' | 'nested'
  lastNickname: string
  onSubmit: (values: CafeCommentFormValues) => void
}

function CommentComposer({ variant, lastNickname, onSubmit }: CommentComposerProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CafeCommentFormValues>({
    resolver: zodResolver(cafeCommentFormSchema),
    defaultValues: { author: lastNickname, body: '' },
  })

  const submit = handleSubmit((values) => {
    onSubmit(values)
    reset({ author: values.author, body: '' })
  })

  return (
    <form
      className={variant === 'nested' ? styles.commentFormNested : styles.commentForm}
      onSubmit={submit}
      noValidate
    >
      <Input
        label={t('cafes.nicknameLabel')}
        placeholder={t('cafes.nicknamePlaceholder')}
        error={errors.author?.message ? t(errors.author.message) : undefined}
        {...register('author')}
      />
      <Textarea
        rows={2}
        label={t('cafes.commentLabel')}
        placeholder={t('cafes.commentPlaceholder')}
        error={errors.body?.message ? t(errors.body.message) : undefined}
        {...register('body')}
      />
      <Button type="submit" variant="outline" size="sm" isLoading={isSubmitting}>
        {t('cafes.commentSubmit')}
      </Button>
    </form>
  )
}

export default CafeDetail
