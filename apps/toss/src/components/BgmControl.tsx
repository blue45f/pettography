import { useEffect, useSyncExternalStore } from 'react'

import { ensurePlaylist, getBgmSnapshot, subscribeBgm, toggleBgm } from '../lib/bgm'
import { haptic, openExternalUrl } from '../lib/toss'
import { theme } from '../theme'

/**
 * BGM 토글 + 크레딧(설정 영역용). 플레이리스트가 없으면 아무것도 렌더하지 않아요.
 * 기본 OFF — 재생은 사용자 토글(제스처)로만 시작해요.
 */
export function BgmControl() {
  const snapshot = useSyncExternalStore(subscribeBgm, getBgmSnapshot)
  const track = snapshot.track

  useEffect(() => {
    void ensurePlaylist()
  }, [])

  if (snapshot.available !== true) return null

  return (
    <div
      style={{
        padding: 16,
        borderRadius: theme.radius,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>배경 음악</div>
          <div style={{ fontSize: 12.5, color: theme.textMuted, marginTop: 2 }}>
            잔잔한 포크 BGM · 기본 꺼짐
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={snapshot.enabled}
          aria-label="배경 음악"
          className="pressable"
          onClick={() => {
            haptic('tickMedium')
            void toggleBgm()
          }}
          style={{
            width: 52,
            height: 32,
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            background: snapshot.enabled ? theme.accent : 'rgba(255,255,255,0.14)',
            transition: 'background 0.2s ease',
            flexShrink: 0,
          }}
        >
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: 4,
              left: snapshot.enabled ? 24 : 4,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </button>
      </div>
      {snapshot.enabled && track && (
        <button
          type="button"
          onClick={() => openExternalUrl(track.creditUrl)}
          className="pressable"
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            marginTop: 10,
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 12,
            lineHeight: 1.5,
            color: theme.textMuted,
          }}
        >
          ♪ {track.title} — {track.artist} ({track.license}) ↗
        </button>
      )}
    </div>
  )
}
