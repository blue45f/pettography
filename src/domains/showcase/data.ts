import type { ShowcasePost, ShowcaseThemeId } from './schema'

export interface ContestTheme {
  id: ShowcaseThemeId
  emoji: string
}

/** Monthly contest themes. Labels/taglines live in i18n under `showcase.themes.<id>`. */
export const CONTEST_THEMES: readonly ContestTheme[] = [
  { id: 'freestyle', emoji: '✨' },
  { id: 'postShed', emoji: '🦎' },
  { id: 'enclosureFull', emoji: '🌿' },
  { id: 'feedingReaction', emoji: '🍽️' },
  { id: 'baby', emoji: '🐣' },
] as const

/** The currently active monthly theme. */
export const CURRENT_THEME_ID: ShowcaseThemeId = 'postShed'

export const SEED_POSTS: readonly ShowcasePost[] = [
  {
    id: 'seed-showcase-1',
    author: '잠실집사',
    petId: null,
    speciesId: 'sp-leopard-gecko',
    imageUrl: 'https://picsum.photos/seed/petto-gecko-shed/600/450',
    caption: '첫 탈피 완료! 발가락까지 깔끔하게 벗었어요. 뿌듯하네요 🥹',
    themeId: 'postShed',
    baseVotes: 32,
    createdAt: '2026-05-26T11:20:00.000Z',
  },
  {
    id: 'seed-showcase-2',
    author: 'spideyy',
    petId: null,
    speciesId: 'sp-mexican-redknee',
    imageUrl: 'https://picsum.photos/seed/petto-tarantula-molt/600/450',
    caption: '탈피 직후 선명해진 레드니 무릎 컬러 보세요. 외골격 굳는 중!',
    themeId: 'postShed',
    baseVotes: 27,
    createdAt: '2026-05-25T19:05:00.000Z',
  },
  {
    id: 'seed-showcase-3',
    author: '비바리움덕후',
    petId: null,
    speciesId: 'sp-leopard-gecko',
    imageUrl: 'https://picsum.photos/seed/petto-vivarium-full/600/450',
    caption: '두 달 걸린 바이오액티브 풀세팅. 이끼가 드디어 자리잡았어요 🌿',
    themeId: 'enclosureFull',
    baseVotes: 38,
    createdAt: '2026-05-24T08:40:00.000Z',
  },
  {
    id: 'seed-showcase-4',
    author: '앵무러버',
    petId: null,
    speciesId: 'sp-cockatiel',
    imageUrl: 'https://picsum.photos/seed/petto-cockatiel-treat/600/450',
    caption: '간식 보자마자 머리 깃 쫙! 이 표정 못 참죠 ㅋㅋ',
    themeId: 'feedingReaction',
    baseVotes: 21,
    createdAt: '2026-05-23T17:15:00.000Z',
  },
  {
    id: 'seed-showcase-5',
    author: '햇살베이비',
    petId: null,
    speciesId: null,
    imageUrl: 'https://picsum.photos/seed/petto-baby-hatchling/600/450',
    caption: '해칭한 지 일주일 된 아기. 손바닥보다 작아요 🐣',
    themeId: 'baby',
    baseVotes: 19,
    createdAt: '2026-05-22T10:30:00.000Z',
  },
  {
    id: 'seed-showcase-6',
    author: '온실주인',
    petId: null,
    speciesId: null,
    imageUrl: 'https://picsum.photos/seed/petto-freestyle-chill/600/450',
    caption: '햇볕 쬐며 늘어진 오후. 별 주제 없이 그냥 예뻐서 올려요 ☀️',
    themeId: 'freestyle',
    baseVotes: 12,
    createdAt: '2026-05-21T14:00:00.000Z',
  },
  {
    id: 'seed-showcase-7',
    author: '게코마스터',
    petId: null,
    speciesId: 'sp-leopard-gecko',
    imageUrl: 'https://picsum.photos/seed/petto-gecko-fresh-skin/600/450',
    caption: '탈피 후 새 피부 광택 좀 보세요. 색이 한층 진해졌어요!',
    themeId: 'postShed',
    baseVotes: 8,
    createdAt: '2026-05-20T21:45:00.000Z',
  },
]
