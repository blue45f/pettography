import { useEffect, useSyncExternalStore } from 'react'

import styles from './BgmDock.module.css'

import { ensurePlaylist, getBgmSnapshot, subscribeBgm, toggleBgm } from '@/lib/bgm'

/**
 * 푸터 BGM 토글 + 크레딧. /audio/playlist.json이 없으면 스스로 완전히 숨어요.
 * 기본 OFF — 재생은 사용자가 토글할 때만 시작해요(자동재생 없음).
 */
function BgmDock() {
  const snapshot = useSyncExternalStore(subscribeBgm, getBgmSnapshot)
  const track = snapshot.track

  useEffect(() => {
    void ensurePlaylist()
  }, [])

  if (snapshot.available !== true) return null

  return (
    <div className={styles.dock}>
      <button
        type="button"
        className={`${styles.toggle} ${snapshot.enabled ? styles.on : ''}`}
        aria-pressed={snapshot.enabled}
        onClick={() => void toggleBgm()}
      >
        <span aria-hidden="true">♪</span> 배경 음악 {snapshot.enabled ? '끄기' : '켜기'}
      </button>
      {snapshot.enabled && track && (
        <a className={styles.credit} href={track.creditUrl} target="_blank" rel="noreferrer">
          {track.title} — {track.artist} ({track.license}) ↗
        </a>
      )}
    </div>
  )
}

export default BgmDock
