import { haptic } from '../lib/toss'
import { navigate } from '../router'
import { theme } from '../theme'

const TABS = [
  { path: '/', label: '홈', icon: '🏠' },
  { path: '/species', label: '도감', icon: '🦎' },
  { path: '/checklist', label: '체크', icon: '☑️' },
  { path: '/library', label: '서재', icon: '📚' },
] as const

/** 토스 플로팅 스타일 하단 탭 내비게이션(4탭). */
export function TabBar({ active }: { active: string }) {
  return (
    <nav
      aria-label="주요 화면"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 'calc(12px + env(safe-area-inset-bottom))',
        zIndex: 40,
        maxWidth: 488,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${TABS.length}, 1fr)`,
          gap: 2,
          padding: 6,
          borderRadius: 26,
          background: 'color-mix(in oklab, #101a13 88%, transparent)',
          backdropFilter: 'blur(16px) saturate(150%)',
          WebkitBackdropFilter: 'blur(16px) saturate(150%)',
          border: `1px solid ${theme.border}`,
          boxShadow: '0 12px 32px -12px rgba(0,0,0,0.65)',
        }}
      >
        {TABS.map((tab) => {
          const on = tab.path === active
          return (
            <button
              key={tab.path}
              type="button"
              aria-label={tab.label}
              aria-current={on ? 'page' : undefined}
              className="pressable"
              onClick={() => {
                if (on) return
                haptic('tickWeak')
                navigate(tab.path)
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '8px 0 7px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                background: on ? theme.accentSoft : 'transparent',
                color: on ? theme.accent : theme.textMuted,
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              <span aria-hidden className={on ? 'tab-icon-pop' : undefined} style={{ fontSize: 20, lineHeight: 1 }}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
