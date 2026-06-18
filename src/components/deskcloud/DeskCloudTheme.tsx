/**
 * DeskCloudTheme — DeskCloud 벤더 위젯을 앱의 다크 테마에 맞추는 비침투적 브리지.
 * ──────────────────────────────────────────────────────────────────────────
 * 벤더링된 각 위젯(SurveyDesk·SearchDesk·ReviewDesk·ChangelogDesk·CommunityDesk·
 * MediaDesk·NotifyDesk)은 업스트림과 1:1로 동일하게 유지하기 위해 라이트 전용
 * 색상을 하드코딩한다. 그 파일들을 수정하면 업스트림과 갈라지고 검증이 어려워지므로,
 * 대신 각 위젯이 노출하는 CSS 커스텀 프로퍼티(--{prefix}-surface/-ink/-border/…)를
 * 앱의 `[data-theme='dark']` 아래에서 한 번만 재정의한다.
 *
 * 왜 이게 안전한가:
 *  - 위젯 내부 규칙은 전부 var(--…) 를 참조하므로, 값만 바꿔 끼우면 마크업/동작 불변.
 *  - 라이트 모드에는 아무 규칙도 추가하지 않는다(기본 라이트 팔레트 그대로).
 *  - 다크 값은 앱 global.css 의 OKLCH 다크 토큰과 동일 계열로 맞춰 한 화면처럼 보인다.
 *  - 스타일은 id 로 1회만 주입(중복 마운트 안전), env-gating 과 무관하게 무해.
 *
 * 접근성: muted/placeholder 가 다크 표면 위에서 ≥4.5:1 대비를 만족하도록 끌어올린다.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { useEffect } from 'react'

const STYLE_ID = 'deskcloud-dark-bridge'

/**
 * 다크 표면 위 토큰. 앱의 [data-theme='dark'] 토큰(global.css)과 동일 계열:
 *   surface  ← --color-surface           ink      ← --color-text
 *   surface2 ← --color-surface-muted     ink-soft ← --color-text-secondary
 *   border   ← --color-border            muted    ← 대비 ≥4.5:1 로 끌어올린 회색
 * muted 는 위젯들이 placeholder·메타 텍스트에 쓰므로, 라이트의 #6b7280(다크에선 ~3:1)
 * 대신 더 밝은 값으로 교체해 본문 대비 기준을 만족시킨다.
 */
const DARK_VARS = `
  --surface: oklch(0.21 0.032 264.7);
  --surface-2: oklch(0.279 0.037 260);
  --surface-3: oklch(0.32 0.034 260);
  --ink: oklch(0.968 0.007 247.9);
  --ink-soft: oklch(0.869 0.02 252.9);
  --muted: oklch(0.78 0.028 256.8);
  --border: oklch(0.372 0.039 257.3);
  --border-strong: oklch(0.46 0.04 257.3);
`

/** prefix 별로 같은 다크 팔레트를 매핑(위젯마다 var 접두만 다름). */
function mapVars(prefix: string): string {
  return DARK_VARS.trim()
    .split('\n')
    .map((line) => line.trim().replace(/^--/, `--${prefix}-`))
    .join(' ')
}

/* 위젯 root 클래스 ↔ var 접두 (cd- 는 changelog/community/media 공용). */
const ROOTS: Array<{ root: string; prefix: string }> = [
  { root: '.sd-root', prefix: 'sd' }, // SurveyDesk(FeedbackWidget)
  { root: '.sk-root', prefix: 'sk' }, // SearchDesk
  { root: '.rd-root', prefix: 'rd' }, // ReviewDesk
  { root: '.cd-root', prefix: 'cd' }, // ChangelogDesk · CommunityDesk · MediaDesk
  { root: '.nd-root', prefix: 'nd' }, // NotifyDesk
]

const CSS = [
  ...ROOTS.map(({ root, prefix }) => `[data-theme='dark'] ${root}{${mapVars(prefix)}}`),
  /* 공용 플로팅 런처(DeskLauncher) — var 가 아니라 리터럴 색을 쓰므로 직접 덮어쓴다. */
  `[data-theme='dark'] .dl-fab{background:oklch(0.278 0.03 256.8);color:oklch(0.968 0.007 247.9);border-color:oklch(0.372 0.039 257.3);}`,
  `[data-theme='dark'] .dl-fab:hover{background:oklch(0.32 0.034 260);}`,
  `[data-theme='dark'] .dl-panel{background:oklch(0.21 0.032 264.7);color:oklch(0.968 0.007 247.9);border-color:oklch(0.372 0.039 257.3);}`,
  `[data-theme='dark'] .dl-panel-header{border-bottom-color:oklch(0.372 0.039 257.3);}`,
  `[data-theme='dark'] .dl-panel-close{color:oklch(0.78 0.028 256.8);}`,
  `[data-theme='dark'] .dl-panel-close:hover{background:oklch(0.279 0.037 260);color:oklch(0.968 0.007 247.9);}`,
  /* NotifyDesk 벨 도크: 모바일에서 하단 내비/SOS FAB 위로 더 끌어올린다(데스크탑 기본 220px). */
  `@media (max-width:860px){:root{--deskcloud-bell-bottom:calc(316px + env(safe-area-inset-bottom, 0px));}}`,
].join('\n')

/**
 * 다크 브리지 스타일시트를 head 에 1회 주입한다. 렌더하는 DOM 은 없다.
 * DeskCloudWidgets 가 항상 마운트되므로 위젯 활성 여부와 무관하게 안전.
 */
export function DeskCloudTheme(): null {
  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
    const el = document.createElement('style')
    el.id = STYLE_ID
    el.textContent = CSS
    document.head.appendChild(el)
  }, [])
  return null
}

export default DeskCloudTheme
