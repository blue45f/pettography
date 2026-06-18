/**
 * MediaPanel — MediaDesk 네이티브 갤러리.
 * ──────────────────────────────────────────────────────────────────────────
 * @heejun/deskcloud 의 MediaClient.listAssets/transformUrl 로 호스팅된 미디어를
 * 읽어 앱 토큰의 반응형 그리드로 렌더한다. transformUrl 로 썸네일을 만들어 가볍게.
 * 사진 파이프라인은 앱의 코어이므로 대체하지 않는다 — 이 패널은 외부 MediaDesk
 * 폴더를 보여줄 때만(VITE_MEDIADESK_URL 설정 시) 보조로 노출된다.
 */
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { getMediaClient } from '../clients'
import styles from '../DeskCloud.module.css'

const FOLDER = 'pettography'

export default function MediaPanel() {
  const { t } = useTranslation()
  const client = getMediaClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['deskcloud', 'media', FOLDER],
    enabled: client !== null,
    retry: false,
    queryFn: async () => {
      if (!client) return null
      return client.listAssets({ folder: FOLDER, limit: 60 })
    },
  })

  if (isLoading) return <Skeleton variant="rectangular" height={160} />
  if (isError) {
    return (
      <EmptyState
        icon="📭"
        title={t('media.errorTitle', '미디어를 불러오지 못했어요')}
        variant="discover"
      />
    )
  }
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        icon="🖼️"
        title={t('media.emptyTitle', '미디어가 없어요')}
        variant="default"
      />
    )
  }

  return (
    <ul className={styles.mediaGrid}>
      {data.items.map((asset) => {
        const thumb = client
          ? client.transformUrl(asset.url, { w: 240, h: 240, format: 'webp', q: 70 })
          : asset.url
        return (
          <li key={asset.key} className={styles.mediaItem}>
            <img src={thumb} alt={asset.key.split('/').pop() ?? ''} loading="lazy" width={240} height={240} />
          </li>
        )
      })}
    </ul>
  )
}
