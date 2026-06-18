/**
 * DeskCloud 네이티브 클라이언트 레이어 — 발행된 npm SDK(@heejun/deskcloud)의
 * 브라우저(pk_) 클라이언트를 앱에 맞게 env-gating·메모이즈해 노출한다.
 * ──────────────────────────────────────────────────────────────────────────
 * 위젯 임베드(벤더 번들/스크립트 주입)를 쓰지 않는다. 각 Desk 는 타입드 SDK
 * 클라이언트로 REST 를 호출하고, 화면은 앱의 자체 컴포넌트/디자인 토큰으로 그린다.
 *
 * 보안: 브라우저 전용 진입점('@heejun/deskcloud')만 import 한다. 서버 전용
 * '@heejun/deskcloud/server'(sk_ 키)는 절대 import 하지 않는다. 키는 모두
 * publishable(pk_) — VITE_*DESK_PK 가 비면 'pk_demo' 로 폴백한다.
 *
 * env-gating: 각 Desk 는 VITE_<DESK>DESK_URL 이 설정됐을 때만 "활성"이다.
 * 미설정이면 클라이언트가 null 이고, 호출부는 앱의 기존 1차(first-party) 기능으로
 * 폴백한다. 따라서 모든 통합은 가역적이며 기본값(미설정)에서는 완전 비활성.
 * ──────────────────────────────────────────────────────────────────────────
 */
import {
  createAdClient,
  createChangelogClient,
  createCommunityClient,
  createMediaClient,
  createNotifyClient,
  createReviewClient,
  createSearchClient,
  createSurveyClient,
  type AdClient,
  type ChangelogClient,
  type CommunityClient,
  type MediaClient,
  type NotifyClient,
  type ReviewClient,
  type SearchClient,
  type SurveyClient,
} from '@heejun/deskcloud'

/** publishable 키 폴백 — 데모/미설정 환경에서도 pk_ 계약을 만족시킨다. */
const PK_DEMO = 'pk_demo'

const env = import.meta.env

/** 한 Desk 의 설정(엔드포인트 + publishable 키). URL 이 있어야만 활성. */
interface DeskConfig {
  endpoint: string
  publishableKey: string
}

/** URL 이 설정돼 있을 때만 DeskConfig 를 만든다(미설정=비활성). */
function readDeskConfig(url: string | undefined, pk: string | undefined): DeskConfig | null {
  const endpoint = url?.trim()
  if (!endpoint) return null
  const publishableKey = pk?.trim() || PK_DEMO
  return { endpoint, publishableKey }
}

/**
 * 각 Desk 의 설정을 모듈 로드시 1회 해석한다(Vite 는 import.meta.env 를 빌드시 인라인).
 * 이 객체가 통합의 단일 가시성 소스다 — `null` 이면 그 Desk 비활성.
 */
const configs = {
  survey: readDeskConfig(env.VITE_SURVEYDESK_URL, env.VITE_SURVEYDESK_PK),
  changelog: readDeskConfig(env.VITE_CHANGELOGDESK_URL, env.VITE_CHANGELOGDESK_PK),
  notify: readDeskConfig(env.VITE_NOTIFYDESK_URL, env.VITE_NOTIFYDESK_PK),
  search: readDeskConfig(env.VITE_SEARCHDESK_URL, env.VITE_SEARCHDESK_PK),
  community: readDeskConfig(env.VITE_COMMUNITYDESK_URL, env.VITE_COMMUNITYDESK_PK),
  review: readDeskConfig(env.VITE_REVIEWDESK_URL, env.VITE_REVIEWDESK_PK),
  media: readDeskConfig(env.VITE_MEDIADESK_URL, env.VITE_MEDIADESK_PK),
  ad: readDeskConfig(env.VITE_ADDESK_URL, env.VITE_ADDESK_PK),
} as const

export type DeskName = keyof typeof configs

/** 한 Desk 가 env-gating 으로 활성화돼 있는지. 호출부의 폴백 분기에 쓴다. */
export function isDeskEnabled(name: DeskName): boolean {
  return configs[name] !== null
}

/** 활성화된 Desk 이름 목록(런처가 표시할 항목 계산용). */
export function enabledDesks(): DeskName[] {
  return (Object.keys(configs) as DeskName[]).filter(isDeskEnabled)
}

/* ── 메모이즈된 클라이언트 팩토리 ──────────────────────────────────────────
 * 클라이언트는 무상태(stateless)지만, 동일 인스턴스를 재사용해 참조 안정성을
 * 확보한다(useEffect 의존성·React Query 키 안정화). 비활성 Desk 는 항상 null.
 */
let surveyClient: SurveyClient | null | undefined
let changelogClient: ChangelogClient | null | undefined
let notifyClient: NotifyClient | null | undefined
let searchClient: SearchClient | null | undefined
let communityClient: CommunityClient | null | undefined
let reviewClient: ReviewClient | null | undefined
let mediaClient: MediaClient | null | undefined
let adClient: AdClient | null | undefined

/** SurveyDesk — 피드백/설문 제출(getActive/submit). 비활성이면 null. */
export function getSurveyClient(): SurveyClient | null {
  if (surveyClient === undefined) {
    surveyClient = configs.survey ? createSurveyClient(configs.survey) : null
  }
  return surveyClient
}

/** ChangelogDesk — 발행된 "새 소식" 읽기(getWall). 비활성이면 null. */
export function getChangelogClient(): ChangelogClient | null {
  if (changelogClient === undefined) {
    changelogClient = configs.changelog ? createChangelogClient(configs.changelog) : null
  }
  return changelogClient
}

/** NotifyDesk — 수신함 읽기 + 읽음 처리(getInbox/markRead). 비활성이면 null. */
export function getNotifyClient(): NotifyClient | null {
  if (notifyClient === undefined) {
    notifyClient = configs.notify ? createNotifyClient(configs.notify) : null
  }
  return notifyClient
}

/** SearchDesk — 전문 검색(search). 비활성이면 null. */
export function getSearchClient(): SearchClient | null {
  if (searchClient === undefined) {
    searchClient = configs.search ? createSearchClient(configs.search) : null
  }
  return searchClient
}

/** CommunityDesk — 게시판 피드 읽기/작성(listPosts/createPost). 비활성이면 null. */
export function getCommunityClient(): CommunityClient | null {
  if (communityClient === undefined) {
    communityClient = configs.community ? createCommunityClient(configs.community) : null
  }
  return communityClient
}

/** ReviewDesk — 후기 월/집계 읽기 + 제출(getWall/getAggregate/submit). 비활성이면 null. */
export function getReviewClient(): ReviewClient | null {
  if (reviewClient === undefined) {
    reviewClient = configs.review ? createReviewClient(configs.review) : null
  }
  return reviewClient
}

/** MediaDesk — 미디어 자산 목록/서빙(listAssets/transformUrl). 비활성이면 null. */
export function getMediaClient(): MediaClient | null {
  if (mediaClient === undefined) {
    mediaClient = configs.media ? createMediaClient(configs.media) : null
  }
  return mediaClient
}

/** AdDesk — 슬롯 배너 서빙/추적(serve/trackImpression/trackClick). 비활성이면 null. */
export function getAdClient(): AdClient | null {
  if (adClient === undefined) {
    adClient = configs.ad ? createAdClient(configs.ad) : null
  }
  return adClient
}

/**
 * SpeciesCatalog "추천(Sponsored)" 레일이 서빙하는 슬롯 키들(슬롯당 1 크리에이티브).
 * `VITE_ADDESK_SLOTS`(콤마 구분)로 배포별 오버라이드. 활성 크리에이티브를 반환하는
 * 슬롯만 렌더되므로, 미설정 슬롯(과 AdDesk OFF 전체)은 보이지 않는다.
 */
export const adSlots: string[] = (
  env.VITE_ADDESK_SLOTS ?? 'species-spotlight-1,species-spotlight-2,species-spotlight-3'
)
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean)
