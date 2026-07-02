// BGM 공통 모듈 배럴 — 상태 구독/토글 유틸만 노출(UI는 Footer의 BgmDock가 담당).
export { ensurePlaylist, getBgmSnapshot, subscribeBgm, toggleBgm } from './bgm'
export type { BgmSnapshot, BgmTrack } from './bgm'
