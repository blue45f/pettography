/**
 * ChangelogPanel — ChangelogDesk 네이티브 "새 소식".
 * ──────────────────────────────────────────────────────────────────────────
 * @heejun/deskcloud 의 ChangelogClient.getWall 로 발행된 엔트리를 읽어 앱의
 * 카드/배지/타이포 토큰으로 렌더한다. 서버가 sanitize 한 bodyHtml 만 그린다.
 * 열릴 때 markSeen 으로 읽음 처리(익명 id 기준). 비활성이면 마운트되지 않음.
 */
import Badge from '@components/common/Badge'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { getChangelogClient } from '../clients'
import styles from '../DeskCloud.module.css'
import { formatRelativeTime, getAnonId } from '../helpers'

import type { ChangelogEntryTag } from '@heejun/deskcloud'

const TAG_VARIANT: Record<ChangelogEntryTag, 'primary' | 'success' | 'warning' | 'default'> = {
  new: 'primary',
  improved: 'success',
  fixed: 'warning',
  announcement: 'default',
}

export default function ChangelogPanel() {
  const { t, i18n } = useTranslation()
  const client = getChangelogClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['deskcloud', 'changelog', 'wall'],
    enabled: client !== null,
    retry: false,
    queryFn: async () => {
      if (!client) return null
      return client.getWall({ limit: 20 })
    },
  })

  // 열려서 데이터가 로드되면 읽음 처리(실패는 조용히 무시 — 표시 기능엔 영향 없음).
  useEffect(() => {
    if (!client || !data) return
    void client.markSeen({ anonId: getAnonId() }).catch(() => {})
  }, [client, data])

  if (isLoading) return <Skeleton lines={5} />
  if (isError) {
    return (
      <EmptyState
        icon="📭"
        title={t('changelog.errorTitle', '소식을 불러오지 못했어요')}
        variant="discover"
      />
    )
  }
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        icon="📰"
        title={t('changelog.emptyTitle', '아직 새 소식이 없어요')}
        description={t('changelog.emptyDesc', '업데이트 소식을 여기서 확인하실 수 있습니다.')}
        variant="default"
      />
    )
  }

  return (
    <ul className={styles.list}>
      {data.items.map((entry) => (
        <li key={entry.id} className={styles.row}>
          <div className={styles.rowHead}>
            <h3 className={styles.rowTitle}>{entry.title}</h3>
            <Badge variant={TAG_VARIANT[entry.tag]}>{entry.tag}</Badge>
          </div>
          <p className={styles.rowMeta}>
            {entry.version ? `v${entry.version} · ` : ''}
            {entry.publishedAt ? formatRelativeTime(entry.publishedAt, i18n.language) : ''}
          </p>
          {/* 서버에서 sanitize 된 HTML(bodyHtml)만 렌더. */}
          <div className={styles.prose} dangerouslySetInnerHTML={{ __html: entry.bodyHtml }} />
        </li>
      ))}
    </ul>
  )
}
