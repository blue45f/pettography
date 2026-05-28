import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { ForumPost, ForumReply } from './schema'
import type { SpeciesCategory } from '@features/species'

const VIEW_DEDUP_MS = 5 * 60 * 1000

interface ForumState {
  posts: ForumPost[]
  replies: Record<string, ForumReply[]>
  likedPostIds: Record<string, true>
  lastViewedAt: Record<string, string>
  addPost: (input: {
    category: SpeciesCategory
    title: string
    author: string
    body: string
  }) => ForumPost
  addReply: (input: { postId: string; author: string; body: string }) => ForumReply
  removePost: (id: string) => void
  removeReply: (postId: string, replyId: string) => void
  toggleLike: (postId: string) => boolean
  recordView: (postId: string) => void
  hydrateSeed: (seed: ForumPost[], replies: Record<string, ForumReply[]>) => void
}

const SEED_POSTS: ForumPost[] = [
  {
    id: 'seed-post-1',
    category: 'reptile',
    title: '레오파드 게코 첫 탈피, 발가락 잔존물 어떻게 처리하시나요?',
    author: '잠실집사',
    body: '입양 8주차 레오파드 게코입니다. 첫 탈피인데 발가락 끝에 잔존물이 남아서 미스팅을 30분 했는데 잘 안 떨어지네요. 다들 어떻게 처리하시는지 궁금합니다.',
    createdAt: '2026-05-20T14:30:00.000Z',
    likes: 12,
    views: 87,
  },
  {
    id: 'seed-post-2',
    category: 'bird',
    title: '코카티엘 자유비행 시간 얼마나 주세요?',
    author: '앵무러버',
    body: '평일에는 출근 때문에 30분 정도밖에 못 빼주는데, 주말에는 4~5시간 케이지 밖에서 둡니다. 평일 시간이 부족할까요?',
    createdAt: '2026-05-22T09:15:00.000Z',
    likes: 5,
    views: 41,
  },
  {
    id: 'seed-post-3',
    category: 'arthropod',
    title: '멕시칸 레드니 탈피 신호 정리',
    author: 'spideyy',
    body: '복부 색이 어두워지고 먹이를 거부하면 탈피 신호입니다. 이때 굴 입구를 막거나 자세가 옆으로 누우면 절대 건드리지 마세요. 1~2주 굶어도 정상.',
    createdAt: '2026-05-25T20:00:00.000Z',
    likes: 21,
    views: 132,
  },
]

const SEED_REPLIES: Record<string, ForumReply[]> = {
  'seed-post-1': [
    {
      id: 'seed-reply-1',
      postId: 'seed-post-1',
      author: '게코마스터',
      body: '습도 70%까지 30분 유지 후 따뜻한 면봉으로 살살. 그래도 안 빠지면 가까운 특수동물병원 가세요. 잘못 잡아당기면 발가락 잘립니다.',
      createdAt: '2026-05-20T15:00:00.000Z',
    },
  ],
  'seed-post-3': [
    {
      id: 'seed-reply-2',
      postId: 'seed-post-3',
      author: '거미바라기',
      body: '+1 탈피 직후 24시간은 외골격 굳을 때까지 먹이도 금지요.',
      createdAt: '2026-05-25T21:00:00.000Z',
    },
  ],
}

interface LegacyForumState {
  posts?: Array<Partial<ForumPost> & { id: string; createdAt: string }>
  replies?: Record<string, ForumReply[]>
}

export const useForumStore = create<ForumState>()(
  persist(
    (set, get) => ({
      posts: SEED_POSTS,
      replies: SEED_REPLIES,
      likedPostIds: {},
      lastViewedAt: {},
      addPost: (input) => {
        const post: ForumPost = {
          id: crypto.randomUUID(),
          ...input,
          createdAt: new Date().toISOString(),
          likes: 0,
          views: 0,
        }
        set((state) => ({ posts: [post, ...state.posts] }))
        return post
      },
      addReply: (input) => {
        const reply: ForumReply = {
          id: crypto.randomUUID(),
          ...input,
          createdAt: new Date().toISOString(),
        }
        set((state) => {
          const next = { ...state.replies }
          next[input.postId] = [...(next[input.postId] ?? []), reply]
          return { replies: next }
        })
        return reply
      },
      removePost: (id) =>
        set((state) => {
          const nextReplies = { ...state.replies }
          delete nextReplies[id]
          const nextLikes = { ...state.likedPostIds }
          delete nextLikes[id]
          const nextViewed = { ...state.lastViewedAt }
          delete nextViewed[id]
          return {
            posts: state.posts.filter((p) => p.id !== id),
            replies: nextReplies,
            likedPostIds: nextLikes,
            lastViewedAt: nextViewed,
          }
        }),
      removeReply: (postId, replyId) =>
        set((state) => {
          const list = state.replies[postId] ?? []
          const next = { ...state.replies, [postId]: list.filter((r) => r.id !== replyId) }
          return { replies: next }
        }),
      toggleLike: (postId) => {
        const liked = Boolean(get().likedPostIds[postId])
        set((state) => {
          const posts = state.posts.map((p) =>
            p.id === postId ? { ...p, likes: Math.max(0, p.likes + (liked ? -1 : 1)) } : p
          )
          const nextLiked = { ...state.likedPostIds }
          if (liked) delete nextLiked[postId]
          else nextLiked[postId] = true
          return { posts, likedPostIds: nextLiked }
        })
        return !liked
      },
      recordView: (postId) => {
        const last = get().lastViewedAt[postId]
        if (last && Date.now() - new Date(last).getTime() < VIEW_DEDUP_MS) return
        const nowIso = new Date().toISOString()
        set((state) => ({
          posts: state.posts.map((p) => (p.id === postId ? { ...p, views: p.views + 1 } : p)),
          lastViewedAt: { ...state.lastViewedAt, [postId]: nowIso },
        }))
      },
      hydrateSeed: (seed, replies) =>
        set({ posts: seed, replies, likedPostIds: {}, lastViewedAt: {} }),
    }),
    {
      name: 'pettography.forum',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted: unknown, version) => {
        if (version >= 2 && persisted && typeof persisted === 'object') {
          return persisted as ForumState
        }
        const legacy = (persisted ?? {}) as LegacyForumState
        const posts: ForumPost[] = (legacy.posts ?? []).map((p) => ({
          id: p.id,
          category: (p.category ?? 'reptile') as ForumPost['category'],
          title: p.title ?? '',
          author: p.author ?? '익명',
          body: p.body ?? '',
          createdAt: p.createdAt,
          likes: typeof p.likes === 'number' ? p.likes : 0,
          views: typeof p.views === 'number' ? p.views : 0,
        }))
        return {
          posts: posts.length > 0 ? posts : SEED_POSTS,
          replies: legacy.replies ?? SEED_REPLIES,
          likedPostIds: {},
          lastViewedAt: {},
        } as unknown as ForumState
      },
    }
  )
)
