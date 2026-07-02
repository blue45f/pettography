/**
 * 경량 BGM 모듈 — 런타임에 /audio/playlist.json을 읽어요.
 * 플레이리스트가 없거나(404/파싱 실패/0곡) 재생 불가면 기능 전체가 숨겨져요.
 * 기본 OFF, 재생은 사용자 제스처(토글)로만 시작 · 페이드인/아웃 · 트랙 로테이션.
 * 합성 엔진/외부 라이브러리 없음 — HTMLAudioElement만 사용해요.
 */

export interface BgmTrack {
  src: string
  title: string
  artist: string
  license: string
  creditUrl: string
}

export interface BgmSnapshot {
  /** null=로딩 전/중, false=플레이리스트 없음(기능 숨김), true=사용 가능 */
  available: boolean | null
  enabled: boolean
  track: BgmTrack | null
}

const PLAYLIST_URL = '/audio/playlist.json'
const TARGET_VOLUME = 0.35
const FADE_MS = 1200
const FADE_STEP_MS = 60

let tracks: BgmTrack[] = []
let trackIndex = 0
let audio: HTMLAudioElement | null = null
let fadeTimer: number | null = null
let playlistPromise: Promise<void> | null = null

let snapshot: BgmSnapshot = { available: null, enabled: false, track: null }
const listeners = new Set<() => void>()

function emit(next: Partial<BgmSnapshot>): void {
  snapshot = { ...snapshot, ...next }
  for (const listener of listeners) listener()
}

export function getBgmSnapshot(): BgmSnapshot {
  return snapshot
}

export function subscribeBgm(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function isTrack(value: unknown): value is BgmTrack {
  if (!value || typeof value !== 'object') return false
  const t = value as Record<string, unknown>
  return (
    typeof t.src === 'string' &&
    typeof t.title === 'string' &&
    typeof t.artist === 'string' &&
    typeof t.license === 'string' &&
    typeof t.creditUrl === 'string'
  )
}

/** 플레이리스트 로드(1회, 캐시). 없으면 available=false → UI가 스스로 숨어요. */
export function ensurePlaylist(): Promise<void> {
  playlistPromise ??= (async () => {
    try {
      const res = await fetch(PLAYLIST_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: unknown = await res.json()
      const list =
        data && typeof data === 'object' && Array.isArray((data as { tracks?: unknown }).tracks)
          ? (data as { tracks: unknown[] }).tracks.filter(isTrack)
          : []
      tracks = list
      emit({ available: tracks.length > 0 })
    } catch {
      tracks = []
      emit({ available: false })
    }
  })()
  return playlistPromise
}

function clearFade(): void {
  if (fadeTimer !== null) {
    window.clearInterval(fadeTimer)
    fadeTimer = null
  }
}

function fadeTo(target: number, onDone?: () => void): void {
  if (!audio) return
  clearFade()
  const el = audio
  const start = el.volume
  const steps = Math.max(1, Math.round(FADE_MS / FADE_STEP_MS))
  let step = 0
  fadeTimer = window.setInterval(() => {
    step += 1
    el.volume = Math.min(1, Math.max(0, start + ((target - start) * step) / steps))
    if (step >= steps) {
      clearFade()
      onDone?.()
    }
  }, FADE_STEP_MS)
}

function playCurrent(): void {
  const track = tracks[trackIndex % tracks.length]
  if (!track) return
  if (audio) {
    audio.onended = null
    audio.pause()
  }
  audio = new Audio(track.src)
  audio.volume = 0
  audio.onended = () => {
    trackIndex = (trackIndex + 1) % tracks.length
    if (snapshot.enabled) playCurrent()
  }
  const el = audio
  el.play()
    .then(() => {
      fadeTo(TARGET_VOLUME)
      emit({ track })
    })
    .catch(() => {
      // 자동재생 정책 등으로 재생 불가 — 토글 상태를 되돌려요.
      if (audio === el) emit({ enabled: false, track: null })
    })
}

/** BGM 토글(사용자 제스처에서만 호출). 켜면 페이드인, 끄면 페이드아웃 후 정지. */
export async function toggleBgm(): Promise<void> {
  await ensurePlaylist()
  if (tracks.length === 0) return
  if (snapshot.enabled) {
    emit({ enabled: false })
    const el = audio
    if (el) {
      fadeTo(0, () => {
        el.pause()
        if (audio === el) {
          audio = null
          emit({ track: null })
        }
      })
    }
    return
  }
  emit({ enabled: true })
  playCurrent()
}
