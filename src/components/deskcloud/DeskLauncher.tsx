/**
 * DeskCloud 공용 플로팅 런처 — 콘텐츠형 Desk 위젯(리뷰/커뮤니티/미디어)을
 * 전용 페이지 없이 비파괴적으로 마운트하기 위한 접근성 다이얼로그 래퍼.
 * ──────────────────────────────────────────────────────────────────────────
 * 의존성 react 만. 스코프 .dl-* 스타일을 1회 주입하므로 앱 토큰과 충돌 없음.
 * 플로팅 버튼 → 클릭 시 role="dialog"(aria-modal) 시트. Esc/바깥클릭 닫기 ·
 * 포커스 트랩 · 열릴 때 패널로 포커스 이동 · 닫으면 트리거로 복귀 ·
 * prefers-reduced-motion · focus-visible 링.
 *
 * 여러 런처를 동시에 띄울 때 겹치지 않도록 order(0,1,2…)로 세로 위치를 어긋나게 둔다.
 * ──────────────────────────────────────────────────────────────────────────
 */
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'

const STYLE_ID = 'deskcloud-launcher-styles'

const FOCUSABLE =
  'a[href],area[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"])'

function ensureStyles(doc: Document = document): void {
  if (doc.getElementById(STYLE_ID)) return
  const el = doc.createElement('style')
  el.id = STYLE_ID
  el.textContent = LAUNCHER_CSS
  doc.head.appendChild(el)
}

export interface DeskLauncherProps {
  /** 플로팅 버튼 라벨(접근성 + 표시 텍스트). */
  label: string
  /** 다이얼로그 제목. 기본은 label. */
  title?: string
  /** 버튼 아이콘(이모지/SVG). 장식이라 aria-hidden 처리. */
  icon?: ReactNode
  /** 0,1,2… — 동시 표시 시 세로로 어긋나게 쌓는 순서. 기본 0. */
  order?: number
  /** 다이얼로그 본문(해당 Desk 위젯). */
  children: ReactNode
}

export function DeskLauncher({
  label,
  title,
  icon,
  order = 0,
  children,
}: DeskLauncherProps): ReactElement {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof document !== 'undefined') ensureStyles()
  }, [])

  // Esc 닫기 + 포커스 트랩
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
        return
      }
      if (e.key !== 'Tab') return
      const root = panelRef.current
      if (!root) return
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement
      )
      if (nodes.length === 0) return
      const first = nodes[0]!
      const last = nodes[nodes.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open])

  // 닫으면 트리거로 포커스 복귀
  const close = (): void => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  // 열리면 패널 내부로 포커스 이동
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      const root = panelRef.current
      if (!root) return
      const target = root.querySelector<HTMLElement>(FOCUSABLE)
      target?.focus()
    }, 20)
    return () => window.clearTimeout(t)
  }, [open])

  const offset = 16 + order * 60

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="dl-fab"
        style={{ bottom: `calc(${offset}px + env(safe-area-inset-bottom, 0px))` }}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {icon ? (
          <span className="dl-fab-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="dl-fab-label">{label}</span>
      </button>

      {open ? (
        <div className="dl-overlay" onMouseDown={close}>
          <div
            ref={panelRef}
            className="dl-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="dl-panel-header">
              <h2 className="dl-panel-title" id={titleId}>
                {title ?? label}
              </h2>
              <button type="button" className="dl-panel-close" aria-label="닫기" onClick={close}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="m6 6 12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="dl-panel-body">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  )
}

const LAUNCHER_CSS = `
.dl-fab, .dl-fab * { box-sizing: border-box; }
.dl-fab {
  position: fixed;
  right: calc(16px + env(safe-area-inset-right, 0px));
  z-index: 2147482000;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #d7dae0;
  border-radius: 999px;
  background: #ffffff;
  color: #1a1d23;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  box-shadow: 0 1px 2px rgba(16,24,40,.06), 0 10px 24px -8px rgba(16,24,40,.22);
  cursor: pointer;
  min-height: 44px;
  transition: transform .14s cubic-bezier(.22,1,.36,1), box-shadow .14s cubic-bezier(.22,1,.36,1);
}
.dl-fab:hover { transform: translateY(-1px); }
.dl-fab:focus { outline: none; }
.dl-fab:focus-visible { outline: 2px solid #2f5fe0; outline-offset: 2px; }
.dl-fab-icon { font-size: 16px; line-height: 1; display: inline-flex; }

.dl-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147482500;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 16px;
  background: rgba(16,24,40,.32);
  animation: dl-fade .16s ease;
}
.dl-panel {
  display: flex;
  flex-direction: column;
  width: min(440px, calc(100vw - 24px));
  max-height: min(640px, calc(100vh - 48px));
  background: #ffffff;
  color: #1a1d23;
  border: 1px solid #d7dae0;
  border-radius: 16px;
  box-shadow: 0 24px 56px -12px rgba(16,24,40,.4);
  overflow: hidden;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  animation: dl-pop .18s cubic-bezier(.22,1,.36,1);
}
.dl-panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid #e6e8ec;
}
.dl-panel-title { margin: 0; flex: 1; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
.dl-panel-close {
  flex: none;
  width: 32px; height: 32px;
  display: inline-flex; align-items: center; justify-content: center;
  border: 0; border-radius: 8px;
  background: transparent; color: #6b7280;
  cursor: pointer;
  transition: background .12s ease, color .12s ease;
}
.dl-panel-close:hover { background: #f4f5f7; color: #1a1d23; }
.dl-panel-close:focus { outline: none; }
.dl-panel-close:focus-visible { outline: 2px solid #2f5fe0; outline-offset: 2px; }
.dl-panel-close svg { width: 18px; height: 18px; }
.dl-panel-body { padding: 16px; overflow-y: auto; -webkit-overflow-scrolling: touch; }

@keyframes dl-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes dl-pop { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .dl-fab, .dl-overlay, .dl-panel {
    animation-duration: .001ms !important;
    transition-duration: .001ms !important;
  }
}
`

export default DeskLauncher
