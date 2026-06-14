import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { removeCommentFromList } from './schema'

import type { Cafe, CafeComment, CafePost } from './schema'
import type { Attachment } from '@features/attachments'
import type { SpeciesCategory } from '@features/species'

const SEED_CAFES: Cafe[] = [
  {
    id: 'cafe-leopard-gecko',
    name: '레오파드 게코 집사 모임',
    description:
      '레오파드 게코 탈피·먹이·모프 이야기를 나누는 카페입니다. 첫 입양 질문도 환영해요.',
    speciesId: 'sp-leopard-gecko',
    speciesName: '레오파드 게코',
    category: 'reptile',
    emoji: '🦎',
    createdBy: '게코마스터',
    createdAt: '2026-05-12T09:00:00.000Z',
    baseMemberCount: 128,
    archivedByAdmin: false,
  },
  {
    id: 'cafe-cockatiel',
    name: '코카티엘 휘파람 클럽',
    description: '코카티엘 훈련·자유비행·발정 관리 노하우를 모읍니다. 소리 영상 설명 환영.',
    speciesId: 'sp-cockatiel',
    speciesName: '코카티엘',
    category: 'bird',
    emoji: '🦜',
    createdBy: '앵무러버',
    createdAt: '2026-05-18T13:30:00.000Z',
    baseMemberCount: 86,
    archivedByAdmin: false,
  },
  {
    id: 'cafe-tarantula',
    name: '타란튤라 키퍼스',
    description: '멕시칸 레드니부터 입문종까지, 탈피·합사 금지 상식·먹이 급여 주기를 공유해요.',
    speciesId: 'sp-mexican-redknee',
    speciesName: '멕시칸 레드니 타란튤라',
    category: 'arthropod',
    emoji: '🕷️',
    createdBy: 'spideyy',
    createdAt: '2026-05-25T19:00:00.000Z',
    baseMemberCount: 41,
    archivedByAdmin: false,
  },
]

const SEED_POSTS: Record<string, CafePost[]> = {
  'cafe-leopard-gecko': [
    {
      id: 'cafe-post-gecko-1',
      cafeId: 'cafe-leopard-gecko',
      title: '습식 은신처 이끼 교체 주기 공유해요',
      author: '게코마스터',
      body: '저는 스파그넘모스를 2주마다 교체합니다. 곰팡이 핀 적 있으신 분들은 주기 줄이세요.',
      createdAt: '2026-05-26T10:00:00.000Z',
      hiddenByAdmin: false,
      attachments: [],
    },
    {
      id: 'cafe-post-gecko-2',
      cafeId: 'cafe-leopard-gecko',
      title: '슈퍼웜만 먹으려는 아이, 귀뚜라미 거부',
      author: '잠실집사',
      body: '편식 교정 어떻게 하셨나요? 일주일 단식시키는 게 맞는지 고민입니다.',
      createdAt: '2026-06-02T21:15:00.000Z',
      hiddenByAdmin: false,
      attachments: [],
    },
  ],
  'cafe-cockatiel': [
    {
      id: 'cafe-post-tiel-1',
      cafeId: 'cafe-cockatiel',
      title: '야간 패닉(나이트 프라이트) 줄인 환경 셋업',
      author: '앵무러버',
      body: '무드등 + 케이지 3면 가림천 조합으로 한 달째 패닉 없습니다. 다들 어떻게 하세요?',
      createdAt: '2026-06-01T08:40:00.000Z',
      hiddenByAdmin: false,
      attachments: [],
    },
  ],
}

const SEED_COMMENTS: Record<string, CafeComment[]> = {
  'cafe-post-gecko-2': [
    {
      id: 'cafe-comment-1',
      postId: 'cafe-post-gecko-2',
      parentCommentId: null,
      author: '게코마스터',
      body: '건강한 성체라면 1~2주 단식은 문제 없어요. 슈퍼웜은 간식으로만.',
      createdAt: '2026-06-03T09:00:00.000Z',
      deleted: false,
    },
    {
      id: 'cafe-comment-1a',
      postId: 'cafe-post-gecko-2',
      parentCommentId: 'cafe-comment-1',
      author: '잠실집사',
      body: '감사합니다! 이번 주는 귀뚜라미만 시도해볼게요.',
      createdAt: '2026-06-03T12:30:00.000Z',
      deleted: false,
    },
  ],
}

interface CreateCafeInput {
  name: string
  description: string
  speciesId: string
  speciesName: string
  category: SpeciesCategory
  emoji: string
  createdBy: string
}

interface AddCafePostInput {
  cafeId: string
  title: string
  author: string
  body: string
  attachments?: Attachment[]
}

interface AddCafeCommentInput {
  postId: string
  parentCommentId?: string | null
  author: string
  body: string
}

interface CafesState {
  cafes: Cafe[]
  posts: Record<string, CafePost[]>
  comments: Record<string, CafeComment[]>
  joinedCafeIds: Record<string, true>
  ownCafeIds: Record<string, true>
  ownPostIds: Record<string, true>
  ownCommentIds: Record<string, true>
  lastNickname: string
  createCafe: (input: CreateCafeInput) => Cafe
  joinCafe: (cafeId: string) => void
  leaveCafe: (cafeId: string) => void
  addPost: (input: AddCafePostInput) => CafePost
  removePost: (cafeId: string, postId: string) => void
  addComment: (input: AddCafeCommentInput) => CafeComment
  removeComment: (postId: string, commentId: string) => void
  setCafeArchived: (cafeId: string, archived: boolean) => void
  removeCafe: (cafeId: string) => void
  setPostHiddenByAdmin: (cafeId: string, postId: string, hidden: boolean) => void
  removePostAttachment: (cafeId: string, postId: string, attachmentId: string) => void
}

export const useCafesStore = create<CafesState>()(
  persist(
    (set, get) => ({
      cafes: SEED_CAFES,
      posts: SEED_POSTS,
      comments: SEED_COMMENTS,
      joinedCafeIds: {},
      ownCafeIds: {},
      ownPostIds: {},
      ownCommentIds: {},
      lastNickname: '',
      createCafe: (input) => {
        const cafe: Cafe = {
          id: crypto.randomUUID(),
          ...input,
          createdAt: new Date().toISOString(),
          baseMemberCount: 0,
          archivedByAdmin: false,
        }
        set((state) => ({
          cafes: [cafe, ...state.cafes],
          ownCafeIds: { ...state.ownCafeIds, [cafe.id]: true },
          joinedCafeIds: { ...state.joinedCafeIds, [cafe.id]: true },
          lastNickname: input.createdBy,
        }))
        return cafe
      },
      joinCafe: (cafeId) =>
        set((state) => ({
          joinedCafeIds: { ...state.joinedCafeIds, [cafeId]: true },
        })),
      leaveCafe: (cafeId) =>
        set((state) => {
          const next = { ...state.joinedCafeIds }
          delete next[cafeId]
          return { joinedCafeIds: next }
        }),
      addPost: (input) => {
        const post: CafePost = {
          id: crypto.randomUUID(),
          cafeId: input.cafeId,
          title: input.title,
          author: input.author,
          body: input.body,
          createdAt: new Date().toISOString(),
          hiddenByAdmin: false,
          attachments: input.attachments ?? [],
        }
        set((state) => ({
          posts: {
            ...state.posts,
            [input.cafeId]: [post, ...(state.posts[input.cafeId] ?? [])],
          },
          ownPostIds: { ...state.ownPostIds, [post.id]: true },
          lastNickname: input.author,
        }))
        return post
      },
      removePost: (cafeId, postId) =>
        set((state) => {
          const nextComments = { ...state.comments }
          delete nextComments[postId]
          const nextOwn = { ...state.ownPostIds }
          delete nextOwn[postId]
          return {
            posts: {
              ...state.posts,
              [cafeId]: (state.posts[cafeId] ?? []).filter((p) => p.id !== postId),
            },
            comments: nextComments,
            ownPostIds: nextOwn,
          }
        }),
      addComment: (input) => {
        // Enforce single-level threads at write time: answering an answer
        // attaches to that answer's root.
        const existing = get().comments[input.postId] ?? []
        let parentCommentId = input.parentCommentId ?? null
        if (parentCommentId) {
          const parent = existing.find((c) => c.id === parentCommentId)
          if (parent?.parentCommentId) parentCommentId = parent.parentCommentId
        }
        const comment: CafeComment = {
          id: crypto.randomUUID(),
          postId: input.postId,
          parentCommentId,
          author: input.author,
          body: input.body,
          createdAt: new Date().toISOString(),
          deleted: false,
        }
        set((state) => ({
          comments: {
            ...state.comments,
            [input.postId]: [...(state.comments[input.postId] ?? []), comment],
          },
          ownCommentIds: { ...state.ownCommentIds, [comment.id]: true },
          lastNickname: input.author,
        }))
        return comment
      },
      removeComment: (postId, commentId) =>
        set((state) => {
          const nextOwn = { ...state.ownCommentIds }
          delete nextOwn[commentId]
          return {
            comments: {
              ...state.comments,
              [postId]: removeCommentFromList(state.comments[postId] ?? [], commentId),
            },
            ownCommentIds: nextOwn,
          }
        }),
      setCafeArchived: (cafeId, archived) =>
        set((state) => ({
          cafes: state.cafes.map((c) =>
            c.id === cafeId ? { ...c, archivedByAdmin: archived } : c
          ),
        })),
      removeCafe: (cafeId) =>
        set((state) => {
          const removedPostIds = new Set((state.posts[cafeId] ?? []).map((p) => p.id))
          const nextPosts = { ...state.posts }
          delete nextPosts[cafeId]
          const nextComments = Object.fromEntries(
            Object.entries(state.comments).filter(([postId]) => !removedPostIds.has(postId))
          )
          const nextJoined = { ...state.joinedCafeIds }
          delete nextJoined[cafeId]
          const nextOwnCafes = { ...state.ownCafeIds }
          delete nextOwnCafes[cafeId]
          return {
            cafes: state.cafes.filter((c) => c.id !== cafeId),
            posts: nextPosts,
            comments: nextComments,
            joinedCafeIds: nextJoined,
            ownCafeIds: nextOwnCafes,
          }
        }),
      setPostHiddenByAdmin: (cafeId, postId, hidden) =>
        set((state) => ({
          posts: {
            ...state.posts,
            [cafeId]: (state.posts[cafeId] ?? []).map((p) =>
              p.id === postId ? { ...p, hiddenByAdmin: hidden } : p
            ),
          },
        })),
      removePostAttachment: (cafeId, postId, attachmentId) =>
        set((state) => ({
          posts: {
            ...state.posts,
            [cafeId]: (state.posts[cafeId] ?? []).map((p) =>
              p.id === postId
                ? { ...p, attachments: p.attachments.filter((a) => a.id !== attachmentId) }
                : p
            ),
          },
        })),
    }),
    {
      name: 'pettography.cafes',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/** Members shown = seeded baseline + the local member when joined. */
export function cafeMemberCount(cafe: Cafe, joined: boolean): number {
  return cafe.baseMemberCount + (joined ? 1 : 0)
}
