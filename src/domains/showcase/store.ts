import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { ShowcasePost, ShowcaseThemeId } from './schema'

interface AddPostInput {
  author: string
  imageUrl: string
  caption: string
  themeId: ShowcaseThemeId
  speciesId?: string | null
  petId?: string | null
}

interface ShowcaseState {
  posts: ShowcasePost[]
  votedIds: Record<string, true>
  ownIds: Record<string, true>
  lastAuthor: string
  seeded: boolean
  hydrateSeed: (seed: readonly ShowcasePost[]) => void
  addPost: (input: AddPostInput) => ShowcasePost
  removePost: (id: string) => void
  toggleVote: (id: string) => boolean
}

export const useShowcaseStore = create<ShowcaseState>()(
  persist(
    (set, get) => ({
      posts: [],
      votedIds: {},
      ownIds: {},
      lastAuthor: '',
      seeded: false,
      hydrateSeed: (seed) =>
        set((state) => {
          if (state.seeded || state.posts.length > 0) return { seeded: true }
          return { posts: [...seed], seeded: true }
        }),
      addPost: (input) => {
        const post: ShowcasePost = {
          id: crypto.randomUUID(),
          author: input.author,
          petId: input.petId ?? null,
          speciesId: input.speciesId ?? null,
          imageUrl: input.imageUrl,
          caption: input.caption,
          themeId: input.themeId,
          baseVotes: 0,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          posts: [post, ...state.posts],
          ownIds: { ...state.ownIds, [post.id]: true },
          lastAuthor: input.author,
        }))
        return post
      },
      removePost: (id) => {
        if (!get().ownIds[id]) return
        set((state) => {
          const nextVoted = { ...state.votedIds }
          delete nextVoted[id]
          const nextOwn = { ...state.ownIds }
          delete nextOwn[id]
          return {
            posts: state.posts.filter((p) => p.id !== id),
            votedIds: nextVoted,
            ownIds: nextOwn,
          }
        })
      },
      toggleVote: (id) => {
        const voted = Boolean(get().votedIds[id])
        set((state) => {
          const nextVoted = { ...state.votedIds }
          if (voted) delete nextVoted[id]
          else nextVoted[id] = true
          return { votedIds: nextVoted }
        })
        return !voted
      },
    }),
    {
      name: 'pettography.showcase',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
)
