/**
 * useNotifyUnreadCount — NotifyDesk 미읽음 수 훅(런처/탭 배지용).
 * 컴포넌트와 분리해 react-refresh(only-export-components) 제약을 지킨다.
 */
import { useQuery } from '@tanstack/react-query'

import { getNotifyClient } from '../clients'
import { getAnonId } from '../helpers'

/** 알림 미읽음 수. NotifyDesk 비활성이면 0. 60초마다 폴링. */
export function useNotifyUnreadCount(): number {
  const client = getNotifyClient()
  const { data } = useQuery({
    queryKey: ['deskcloud', 'notify', 'inbox', 'unread'],
    enabled: client !== null,
    retry: false,
    refetchInterval: 60_000,
    queryFn: async () => {
      if (!client) return 0
      const res = await client.getUnreadCount({ recipientId: getAnonId() })
      return res.unreadCount
    },
  })
  return data ?? 0
}
