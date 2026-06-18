/**
 * DeskHub — DeskCloud 네이티브 통합 허브(단일 플로팅 런처 + 탭 시트).
 * ──────────────────────────────────────────────────────────────────────────
 * 활성화된 Desk(VITE_<DESK>DESK_URL 설정분)만 탭으로 노출한다. 진입은 앱 디자인에
 * 맞춘 단일 알약형 버튼 하나뿐 — 벤더 위젯 FAB 스택/스크립트 주입을 대체한다.
 * 콘텐츠는 앱의 Modal(포커스 트랩·Esc·스크롤락)과 자체 패널로 렌더한다.
 *
 * 활성 Desk 가 하나도 없으면(기본값) 아무것도 렌더하지 않는다 → 가역적·무해.
 * 알림 미읽음 수는 런처/탭 배지로 표시한다.
 */
import Modal from '@components/common/Modal'
import { Suspense, lazy, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'

import { isDeskEnabled, type DeskName } from './clients'
import styles from './DeskCloud.module.css'
import { useNotifyUnreadCount } from './panels/useNotifyUnread'

// 패널은 시트가 열릴 때만 필요하므로 지연 로드(초기 번들 영향 최소화).
const FeedbackPanel = lazy(() => import('./panels/FeedbackPanel'))
const ChangelogPanel = lazy(() => import('./panels/ChangelogPanel'))
const NotificationPanel = lazy(() => import('./panels/NotificationPanel'))
const SearchPanel = lazy(() => import('./panels/SearchPanel'))
const ReviewPanel = lazy(() => import('./panels/ReviewPanel'))
const CommunityPanel = lazy(() => import('./panels/CommunityPanel'))
const MediaPanel = lazy(() => import('./panels/MediaPanel'))

interface TabDef {
  desk: DeskName
  icon: string
  label: string
  Panel: ComponentType
}

/** 활성 Desk → 탭 정의. enabledDesks() 순서대로 표시. */
function useTabs(): TabDef[] {
  const { t } = useTranslation()
  const all: TabDef[] = [
    { desk: 'notify', icon: '🔔', label: t('deskhub.notify', '알림'), Panel: NotificationPanel },
    { desk: 'changelog', icon: '📰', label: t('deskhub.changelog', '새 소식'), Panel: ChangelogPanel },
    { desk: 'search', icon: '🔍', label: t('deskhub.search', '검색'), Panel: SearchPanel },
    { desk: 'review', icon: '⭐', label: t('deskhub.review', '후기'), Panel: ReviewPanel },
    { desk: 'community', icon: '💬', label: t('deskhub.community', '커뮤니티'), Panel: CommunityPanel },
    { desk: 'media', icon: '🖼️', label: t('deskhub.media', '갤러리'), Panel: MediaPanel },
    { desk: 'survey', icon: '🗳️', label: t('deskhub.feedback', '피드백'), Panel: FeedbackPanel },
  ]
  return all.filter((tab) => isDeskEnabled(tab.desk))
}

export function DeskHub() {
  const { t } = useTranslation()
  const tabs = useTabs()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const unread = useNotifyUnreadCount()

  // 활성 Desk 가 없으면 통합 자체를 렌더하지 않는다(기본값=완전 비활성).
  if (tabs.length === 0) return null

  const current = tabs[Math.min(active, tabs.length - 1)]
  const ActivePanel = current.Panel
  const showLauncherBadge = unread > 0 && isDeskEnabled('notify')

  return (
    <>
      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={t('deskhub.open', '서비스 허브 열기')}
      >
        <span className={styles.launcherIcon} aria-hidden="true">
          ✦
        </span>
        <span>{t('deskhub.title', '서비스 허브')}</span>
        {showLauncherBadge && (
          <span className={styles.launcherBadge} aria-label={t('deskhub.unread', { defaultValue: '읽지 않은 알림 {{n}}개', n: unread })}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={t('deskhub.title', '서비스 허브')} size="lg">
        <div className={styles.hub}>
          {tabs.length > 1 && (
            <div className={styles.tablist} role="tablist" aria-label={t('deskhub.title', '서비스 허브')}>
              {tabs.map((tab, i) => {
                const tabUnread = tab.desk === 'notify' ? unread : 0
                return (
                  <button
                    key={tab.desk}
                    type="button"
                    role="tab"
                    id={`deskhub-tab-${tab.desk}`}
                    aria-selected={i === active}
                    aria-controls={`deskhub-panel-${tab.desk}`}
                    className={styles.tab}
                    onClick={() => setActive(i)}
                  >
                    <span aria-hidden="true">{tab.icon}</span>
                    {tab.label}
                    {tabUnread > 0 && (
                      <span className={styles.tabBadge} aria-hidden="true">
                        {tabUnread > 99 ? '99+' : tabUnread}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
          <div
            className={styles.panel}
            role="tabpanel"
            id={`deskhub-panel-${current.desk}`}
            aria-labelledby={`deskhub-tab-${current.desk}`}
          >
            <Suspense fallback={null}>
              <ActivePanel />
            </Suspense>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default DeskHub
