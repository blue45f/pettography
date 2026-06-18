/**
 * CommunityPanel — CommunityDesk 네이티브 게시판 피드.
 * ──────────────────────────────────────────────────────────────────────────
 * @heejun/deskcloud 의 CommunityClient.listPosts 로 보드 글을 읽어 앱 토큰으로
 * 렌더한다. 이 앱은 자체 /communities·/forum(코어)를 가지므로, 이 패널은 외부
 * CommunityDesk 보드를 연결할 때만(VITE_COMMUNITYDESK_URL 설정 시) 보조로 노출된다.
 */
import Badge from '@components/common/Badge'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { getCommunityClient } from '../clients'
import styles from '../DeskCloud.module.css'
import { formatRelativeTime } from '../helpers'

const BOARD_SLUG = 'free'

export default function CommunityPanel() {
  const { t, i18n } = useTranslation()
  const client = getCommunityClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['deskcloud', 'community', BOARD_SLUG],
    enabled: client !== null,
    retry: false,
    queryFn: async () => {
      if (!client) return null
      return client.listPosts({ boardSlug: BOARD_SLUG, sort: 'recent', limit: 20 })
    },
  })

  if (isLoading) return <Skeleton lines={5} />
  if (isError) {
    return (
      <EmptyState
        icon="📭"
        title={t('community.errorTitle', '글을 불러오지 못했어요')}
        variant="discover"
      />
    )
  }
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        icon="💬"
        title={t('community.emptyTitle', '아직 글이 없어요')}
        description={t('community.emptyDesc', '첫 글을 기다리고 있어요.')}
        variant="default"
      />
    )
  }

  return (
    <ul className={styles.list}>
      {data.items.map((post) => (
        <li key={post.id} className={styles.row}>
          <div className={styles.rowHead}>
            <h3 className={styles.rowTitle}>
              {post.pinned && <Badge variant="primary">{t('community.pinned', '고정')}</Badge>}{' '}
              {post.title ?? t('community.untitled', '(제목 없음)')}
            </h3>
            <span className={styles.rowMeta}>
              {formatRelativeTime(post.createdAt, i18n.language)}
            </span>
          </div>
          <p className={styles.rowBody}>{post.excerpt}</p>
          <span className={styles.rowMeta}>
            {post.authorName} ·{' '}
            {t('community.replyCount', { defaultValue: '댓글 {{n}}', n: post.replyCount })}
          </span>
        </li>
      ))}
    </ul>
  )
}
