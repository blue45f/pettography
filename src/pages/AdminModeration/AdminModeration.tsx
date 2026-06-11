import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import { useToast } from '@components/common/Toast'
import AdminGate from '@components/layout/AdminGate'
import { useCafesStore } from '@features/cafes'
import { useForumStore } from '@features/forum'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './AdminModeration.module.css'

import type { Attachment } from '@features/attachments'

type ModerationFilter = 'all' | 'flagged' | 'hidden'

interface ModerationRow {
  key: string
  source: 'forum' | 'cafe'
  sourceLabel: string
  title: string
  author: string
  createdAt: string
  body: string
  reportCount: number
  autoHidden: boolean
  hiddenByAdmin: boolean
  attachments: readonly Attachment[]
  onToggleHidden: (hidden: boolean) => void
  onRemove: () => void
  onRemoveAttachment: (attachmentId: string) => void
}

function AdminModeration() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('admin.areaModeration'))

  const forumPosts = useForumStore((s) => s.posts)
  const setForumHidden = useForumStore((s) => s.setPostHiddenByAdmin)
  const removeForumPost = useForumStore((s) => s.removePost)
  const removeForumAttachment = useForumStore((s) => s.removePostAttachment)

  const cafes = useCafesStore((s) => s.cafes)
  const cafePostsMap = useCafesStore((s) => s.posts)
  const setCafeHidden = useCafesStore((s) => s.setPostHiddenByAdmin)
  const removeCafePost = useCafesStore((s) => s.removePost)
  const removeCafeAttachment = useCafesStore((s) => s.removePostAttachment)

  const [filter, setFilter] = useState<ModerationFilter>('all')

  const rows: ModerationRow[] = [
    ...forumPosts.map(
      (post): ModerationRow => ({
        key: `forum-${post.id}`,
        source: 'forum',
        sourceLabel: t('admin.forumSection'),
        title: post.title,
        author: post.author,
        createdAt: post.createdAt,
        body: post.body,
        reportCount: post.reportCount,
        autoHidden: post.autoHidden,
        hiddenByAdmin: post.hiddenByAdmin,
        attachments: post.attachments,
        onToggleHidden: (hidden) => setForumHidden(post.id, hidden),
        onRemove: () => removeForumPost(post.id),
        onRemoveAttachment: (attachmentId) => removeForumAttachment(post.id, attachmentId),
      }),
    ),
    ...Object.entries(cafePostsMap).flatMap(([cafeId, posts]) =>
      posts.map((post): ModerationRow => {
        const cafe = cafes.find((c) => c.id === cafeId)
        return {
          key: `cafe-${post.id}`,
          source: 'cafe',
          sourceLabel: cafe ? cafe.name : t('admin.cafeSection'),
          title: post.title,
          author: post.author,
          createdAt: post.createdAt,
          body: post.body,
          reportCount: 0,
          autoHidden: false,
          hiddenByAdmin: post.hiddenByAdmin,
          attachments: post.attachments,
          onToggleHidden: (hidden) => setCafeHidden(cafeId, post.id, hidden),
          onRemove: () => removeCafePost(cafeId, post.id),
          onRemoveAttachment: (attachmentId) => removeCafeAttachment(cafeId, post.id, attachmentId),
        }
      }),
    ),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const visible = rows.filter((row) => {
    if (filter === 'hidden') return row.hiddenByAdmin || row.autoHidden
    if (filter === 'flagged') return row.reportCount > 0 || row.autoHidden || row.hiddenByAdmin
    return true
  })

  const filters: { id: ModerationFilter; label: string }[] = [
    { id: 'all', label: t('admin.filterAll') },
    { id: 'flagged', label: t('admin.filterFlagged') },
    { id: 'hidden', label: t('admin.filterHidden') },
  ]

  return (
    <AdminGate>
      <section className={styles.page}>
        <header className={styles.header}>
          <p className={styles.backRow}>
            <Link to="/admin" className={styles.backLink}>
              ← {t('admin.title')}
            </Link>
          </p>
          <h1>{t('admin.areaModeration')}</h1>
          <p className={styles.subtitle}>{t('admin.moderationSubtitle')}</p>
        </header>

        <div role="radiogroup" aria-label={t('admin.filterLabel')} className={styles.filters}>
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={filter === f.id}
              className={[styles.filterChip, filter === f.id ? styles.filterActive : ''].join(' ')}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length === 0 && <EmptyState icon="🧹" title={t('admin.moderationEmpty')} />}

        <ul className={styles.list}>
          {visible.map((row) => (
            <li key={row.key}>
              <Card padding="md" className={styles.rowCard}>
                <Card.Body>
                  <div className={styles.rowHeader}>
                    <div className={styles.rowMeta}>
                      <strong>{row.title}</strong>
                      <p className={styles.rowSub}>
                        <Badge variant={row.source === 'forum' ? 'primary' : 'default'}>
                          {row.sourceLabel}
                        </Badge>{' '}
                        {row.author} · {new Date(row.createdAt).toLocaleString('ko')}
                      </p>
                    </div>
                    <div className={styles.rowBadges}>
                      {row.reportCount > 0 && (
                        <Badge variant="warning">
                          {t('admin.reportedBadge', { count: row.reportCount })}
                        </Badge>
                      )}
                      {row.autoHidden && (
                        <Badge variant="error">{t('admin.autoHiddenBadge')}</Badge>
                      )}
                      {row.hiddenByAdmin && <Badge variant="error">{t('admin.hiddenBadge')}</Badge>}
                    </div>
                  </div>
                  <p className={styles.rowBody}>{row.body}</p>

                  {row.attachments.length > 0 && (
                    <ul className={styles.attachmentList}>
                      {row.attachments.map((attachment) => (
                        <li key={attachment.id} className={styles.attachmentItem}>
                          {attachment.kind === 'image' ? (
                            <img
                              src={attachment.dataUrl}
                              alt={t('attachments.imageAlt', { name: attachment.name })}
                              className={styles.attachmentThumb}
                            />
                          ) : (
                            <span className={styles.attachmentPdf} aria-hidden="true">
                              PDF
                            </span>
                          )}
                          <span className={styles.attachmentName}>{attachment.name}</span>
                          <button
                            type="button"
                            className={styles.dangerLink}
                            onClick={() => {
                              row.onRemoveAttachment(attachment.id)
                              toast(t('admin.attachmentRemovedToast'), 'success')
                            }}
                          >
                            {t('admin.removeAttachment')}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className={styles.rowActions}>
                    {row.hiddenByAdmin ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          row.onToggleHidden(false)
                          toast(t('admin.restoredToast'), 'success')
                        }}
                      >
                        {t('admin.restore')}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          row.onToggleHidden(true)
                          toast(t('admin.hiddenToast'), 'success')
                        }}
                      >
                        {t('admin.hide')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        row.onRemove()
                        toast(t('admin.deletedToast'), 'success')
                      }}
                    >
                      {t('admin.delete')}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </AdminGate>
  )
}

export default AdminModeration
