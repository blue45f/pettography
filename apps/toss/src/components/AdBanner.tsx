import { useEffect, useRef, useState } from 'react'

import { getBannerAdGroupId, useTossBanner } from '../lib/ads'

/**
 * 앱인토스 배너 광고 슬롯(높이 96px, width 100%).
 * - 내부는 비워두고 SDK가 채워요. 언마운트 시 destroy로 정리.
 * - onNoFill/렌더 실패 시 슬롯을 접어요(빈 박스 방지).
 * - env 미설정(운영)·미지원 환경·토스 앱 5.241.0 미만이면 렌더하지 않아요.
 */
export function AdBanner({ style }: { style?: React.CSSProperties }) {
  const { ready, attach, supported } = useTossBanner()
  const adGroupId = getBannerAdGroupId()
  const slotRef = useRef<HTMLDivElement | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!ready || !adGroupId || collapsed) return
    const element = slotRef.current
    if (!element) return
    const banner = attach(adGroupId, element, {
      theme: 'dark',
      callbacks: {
        onNoFill: () => setCollapsed(true),
        onAdFailedToRender: () => setCollapsed(true),
      },
    })
    if (!banner) return
    return () => {
      try {
        banner.destroy()
      } catch {
        // 이미 정리된 경우 무시
      }
    }
  }, [ready, adGroupId, collapsed, attach])

  if (!adGroupId || !supported || collapsed) return null

  return (
    <aside aria-label="광고" style={{ width: '100%', ...style }}>
      <div ref={slotRef} style={{ width: '100%', height: 96 }} />
    </aside>
  )
}
