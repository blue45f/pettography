/**
 * NotificationPanel — NotifyDesk 네이티브 수신함.
 * ──────────────────────────────────────────────────────────────────────────
 * @heejun/deskcloud 의 NotifyClient.getInbox/markRead 로 익명 수신자의 인앱
 * 알림을 읽고 읽음 처리한다. 앱의 카드/버튼/타이포로 렌더. 비활성이면 미마운트.
 */
import Button from '@components/common/Button'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { getNotifyClient } from '../clients'
import styles from '../DeskCloud.module.css'
import { formatRelativeTime, getAnonId } from '../helpers'

const INBOX_KEY = ['deskcloud', 'notify', 'inbox'] as const

export default function NotificationPanel() {
  const { t, i18n } = useTranslation()
  const client = getNotifyClient()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: INBOX_KEY,
    enabled: client !== null,
    retry: false,
    queryFn: async () => {
      if (!client) return null
      return client.getInbox({ recipientId: getAnonId(), limit: 30 })
    },
  })

  async function markAllRead() {
    if (!client) return
    await client.markRead({ recipientId: getAnonId(), all: true })
    await queryClient.invalidateQueries({ queryKey: ['deskcloud', 'notify'] })
  }

  if (isLoading) return <Skeleton lines={4} />
  if (isError) {
    return (
      <EmptyState
        icon="📭"
        title={t('notify.errorTitle', '알림을 불러오지 못했어요')}
        variant="discover"
      />
    )
  }
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        icon="🔔"
        title={t('notify.emptyTitle', '새 알림이 없어요')}
        description={t('notify.emptyDesc', '중요한 소식이 오면 여기에 표시됩니다.')}
        variant="default"
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      {data.unreadCount > 0 && (
        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={() => void markAllRead()}>
            {t('notify.markAllRead', '모두 읽음')}
          </Button>
        </div>
      )}
      <ul className={styles.list}>
        {data.items.map((item) => (
          <li
            key={item.id}
            className={item.status === 'read' ? styles.row : `${styles.row} ${styles.unread}`}
          >
            <div className={styles.rowHead}>
              <h3 className={styles.rowTitle}>{item.title}</h3>
              <span className={styles.rowMeta}>
                {formatRelativeTime(item.createdAt, i18n.language)}
              </span>
            </div>
            <p className={styles.rowBody}>{item.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
