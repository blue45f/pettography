/**
 * DeskCloudWidgets — DeskCloud 위젯들을 앱 셸에 한 번만 마운트하는 집약 컴포넌트.
 * ──────────────────────────────────────────────────────────────────────────
 * 각 Desk 는 자신의 VITE_*DESK_URL 이 설정됐을 때만 렌더된다(미설정=완전 비활성).
 * publishable 키는 VITE_*DESK_PK 로 주입하고, 없으면 'pk_demo' 로 폴백한다.
 *
 *  - changelogdesk : ChangelogWidget   — 플로팅 "새 소식" 런처(자체 위치 지정)
 *  - notifydesk    : NotificationBell  — 우하단 고정 알림 벨
 *  - searchdesk    : SearchPalette     — ⌘⇧K 검색 팔레트(앱의 ⌘K 커맨드와 충돌 회피)
 *  - reviewdesk    : ReviewForm        — 플로팅 런처(리뷰 작성)
 *  - communitydesk : CommunityFeed     — 플로팅 런처(커뮤니티 피드)
 *  - mediadesk     : MediaGallery      — 플로팅 런처(미디어 갤러리)
 *
 * 모든 위젯은 react 전용 · 자체 스코프 스타일이라 앱의 OKLCH 토큰/Tailwind 와 충돌 없음.
 * ──────────────────────────────────────────────────────────────────────────
 */
import type { ReactElement } from 'react'

import { ChangelogWidget } from './changelogdesk/ChangelogWidget'
import { CommunityFeed } from './communitydesk/CommunityBoard'
import { DeskCloudTheme } from './DeskCloudTheme'
import { DeskLauncher } from './DeskLauncher'
import { MediaGallery } from './mediadesk/MediaWidgets'
import { NotificationBell } from './notifydesk/NotificationBell'
import { ReviewForm } from './reviewdesk/ReviewWidgets'
import { SearchPalette } from './searchdesk/SearchPalette'

const env = import.meta.env

/** publishable 키 폴백 — 데모/미설정 환경에서도 위젯 계약을 만족시킨다. */
const PK_DEMO = 'pk_demo'

/**
 * NotifyDesk 벨 도크. 헤더(sticky, top:0)에는 이미 앱 자체 AlertBell 이 있고,
 * 이 벨은 z-index 가 훨씬 높아 우상단에 두면 헤더 컨트롤과 겹친다. 따라서
 * 우하단에 띄우되, DeskLauncher 스택(16/76/136px) 위쪽으로 올려 충돌을 피한다.
 * 모바일에서는 하단 내비/SOS FAB 영역을 비우기 위해 추가로 끌어올린다(CSS 변수).
 */
const BELL_DOCK_STYLE: React.CSSProperties = {
  position: 'fixed',
  right: 'calc(16px + env(safe-area-inset-right, 0px))',
  bottom: 'var(--deskcloud-bell-bottom, calc(220px + env(safe-area-inset-bottom, 0px)))',
  zIndex: 2147482000,
}

export function DeskCloudWidgets(): ReactElement {
  return (
    <>
      {/* 벤더 위젯을 앱 다크 테마에 맞추는 비침투 브리지(렌더 DOM 없음, 1회 스타일 주입). */}
      <DeskCloudTheme />

      {/* changelogdesk — 플로팅 "새 소식" 런처(VITE_CHANGELOGDESK_URL) */}
      {env.VITE_CHANGELOGDESK_URL && (
        <ChangelogWidget
          publishableKey={env.VITE_CHANGELOGDESK_PK ?? PK_DEMO}
          endpoint={env.VITE_CHANGELOGDESK_URL}
          title="새 소식"
          label="새 소식"
        />
      )}

      {/* notifydesk — 우상단 고정 알림 벨(VITE_NOTIFYDESK_URL) */}
      {env.VITE_NOTIFYDESK_URL && (
        <div style={BELL_DOCK_STYLE}>
          <NotificationBell
            recipientId="anon"
            publishableKey={env.VITE_NOTIFYDESK_PK ?? PK_DEMO}
            endpoint={env.VITE_NOTIFYDESK_URL}
          />
        </div>
      )}

      {/* searchdesk — ⌘⇧K 검색 팔레트(VITE_SEARCHDESK_URL) */}
      {env.VITE_SEARCHDESK_URL && (
        <SearchPalette
          publishableKey={env.VITE_SEARCHDESK_PK ?? PK_DEMO}
          endpoint={env.VITE_SEARCHDESK_URL}
          hotkey="mod+shift+k"
          placeholder="검색…"
        />
      )}

      {/* reviewdesk — 플로팅 리뷰 작성 런처(VITE_REVIEWDESK_URL) */}
      {env.VITE_REVIEWDESK_URL && (
        <DeskLauncher label="리뷰 남기기" title="리뷰 작성" icon="⭐" order={0}>
          <ReviewForm
            publishableKey={env.VITE_REVIEWDESK_PK ?? PK_DEMO}
            endpoint={env.VITE_REVIEWDESK_URL}
            subjectId="pettography"
            subjectLabel="Pettography"
          />
        </DeskLauncher>
      )}

      {/* communitydesk — 플로팅 커뮤니티 피드 런처(VITE_COMMUNITYDESK_URL) */}
      {env.VITE_COMMUNITYDESK_URL && (
        <DeskLauncher label="커뮤니티" title="커뮤니티 피드" icon="💬" order={1}>
          <CommunityFeed
            publishableKey={env.VITE_COMMUNITYDESK_PK ?? PK_DEMO}
            endpoint={env.VITE_COMMUNITYDESK_URL}
            boardSlug="free"
            title="최근 글"
          />
        </DeskLauncher>
      )}

      {/* mediadesk — 플로팅 미디어 갤러리 런처(VITE_MEDIADESK_URL) */}
      {env.VITE_MEDIADESK_URL && (
        <DeskLauncher label="갤러리" title="미디어 갤러리" icon="🖼️" order={2}>
          <MediaGallery
            publishableKey={env.VITE_MEDIADESK_PK ?? PK_DEMO}
            endpoint={env.VITE_MEDIADESK_URL}
            folder="pettography"
          />
        </DeskLauncher>
      )}
    </>
  )
}

export default DeskCloudWidgets
