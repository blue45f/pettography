import { useEffect, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './BgmDock.module.css'

import { ensurePlaylist, getBgmSnapshot, subscribeBgm, toggleBgm } from '@/lib/bgm'

function safeCreditUrl(value: string): string | null {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

function BgmDock() {
  const { t } = useTranslation()
  const snapshot = useSyncExternalStore(subscribeBgm, getBgmSnapshot)
  const track = snapshot.track

  useEffect(() => {
    void ensurePlaylist()
  }, [])

  if (snapshot.available !== true) return null

  const credit = track
    ? t('bgm.credit', { title: track.title, artist: track.artist, license: track.license })
    : ''
  const creditUrl = track ? safeCreditUrl(track.creditUrl) : null

  return (
    <div className={styles.dock}>
      <button
        type="button"
        className={`${styles.toggle} ${snapshot.enabled ? styles.on : ''}`}
        aria-pressed={snapshot.enabled}
        onClick={() => void toggleBgm()}
      >
        <span aria-hidden="true">♪</span>
        {snapshot.enabled ? t('bgm.turnOff') : t('bgm.turnOn')}
      </button>
      {snapshot.enabled &&
        track &&
        (creditUrl ? (
          <a
            className={styles.credit}
            href={creditUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={t('bgm.openCredit', { title: track.title })}
          >
            {credit} <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span className={styles.credit}>{credit}</span>
        ))}
    </div>
  )
}

export default BgmDock
