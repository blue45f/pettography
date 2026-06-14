import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { SEED_POSTS } from './data'
import { topPostForTheme, voteCount } from './schema'
import { useShowcaseStore } from './store'

function resetStore() {
  useShowcaseStore.setState({
    posts: [],
    votedIds: {},
    ownIds: {},
    lastAuthor: '',
    seeded: false,
  })
}

beforeEach(() => {
  localStorage.clear()
  resetStore()
})

afterEach(() => {
  resetStore()
})

describe('showcase store', () => {
  describe('hydrateSeed', () => {
    it('seeds posts when empty', () => {
      useShowcaseStore.getState().hydrateSeed(SEED_POSTS)
      const state = useShowcaseStore.getState()
      expect(state.posts).toHaveLength(SEED_POSTS.length)
      expect(state.seeded).toBe(true)
    })

    it('is idempotent — a second call does not duplicate or overwrite', () => {
      const store = useShowcaseStore.getState()
      store.hydrateSeed(SEED_POSTS)
      const added = store.addPost({
        author: '테스터',
        imageUrl: 'https://example.com/a.jpg',
        caption: '안녕',
        themeId: 'freestyle',
      })
      // Re-hydrating must not wipe the user's post nor re-add seeds.
      useShowcaseStore.getState().hydrateSeed(SEED_POSTS)
      const state = useShowcaseStore.getState()
      expect(state.posts).toHaveLength(SEED_POSTS.length + 1)
      expect(state.posts[0].id).toBe(added.id)
    })
  })

  describe('addPost', () => {
    it('prepends the post, marks ownership, and stores lastAuthor', () => {
      const store = useShowcaseStore.getState()
      const post = store.addPost({
        author: '새집사',
        imageUrl: 'https://example.com/photo.jpg',
        caption: '첫 사진',
        themeId: 'baby',
        speciesId: 'sp-leopard-gecko',
      })
      const state = useShowcaseStore.getState()
      expect(state.posts[0].id).toBe(post.id)
      expect(state.posts[0].speciesId).toBe('sp-leopard-gecko')
      expect(state.posts[0].baseVotes).toBe(0)
      expect(state.ownIds[post.id]).toBe(true)
      expect(state.lastAuthor).toBe('새집사')
    })
  })

  describe('toggleVote', () => {
    it('adds then removes a vote, returning the new voted state', () => {
      const store = useShowcaseStore.getState()
      const post = store.addPost({
        author: '집사',
        imageUrl: 'https://example.com/x.jpg',
        caption: 'hi',
        themeId: 'freestyle',
      })
      expect(useShowcaseStore.getState().toggleVote(post.id)).toBe(true)
      expect(useShowcaseStore.getState().votedIds[post.id]).toBe(true)
      expect(
        voteCount(useShowcaseStore.getState().posts[0], useShowcaseStore.getState().votedIds)
      ).toBe(1)

      expect(useShowcaseStore.getState().toggleVote(post.id)).toBe(false)
      expect(useShowcaseStore.getState().votedIds[post.id]).toBeUndefined()
      expect(
        voteCount(useShowcaseStore.getState().posts[0], useShowcaseStore.getState().votedIds)
      ).toBe(0)
    })
  })

  describe('removePost', () => {
    it('removes a post the user owns and clears its vote', () => {
      const store = useShowcaseStore.getState()
      const post = store.addPost({
        author: '집사',
        imageUrl: 'https://example.com/y.jpg',
        caption: 'bye',
        themeId: 'freestyle',
      })
      useShowcaseStore.getState().toggleVote(post.id)
      useShowcaseStore.getState().removePost(post.id)
      const state = useShowcaseStore.getState()
      expect(state.posts.find((p) => p.id === post.id)).toBeUndefined()
      expect(state.votedIds[post.id]).toBeUndefined()
      expect(state.ownIds[post.id]).toBeUndefined()
    })

    it('does not remove a post the user does not own', () => {
      useShowcaseStore.getState().hydrateSeed(SEED_POSTS)
      const seedId = SEED_POSTS[0].id
      useShowcaseStore.getState().removePost(seedId)
      expect(useShowcaseStore.getState().posts.find((p) => p.id === seedId)).toBeDefined()
    })
  })

  describe('topPostForTheme', () => {
    it('returns the highest voteCount post for the theme', () => {
      useShowcaseStore.getState().hydrateSeed(SEED_POSTS)
      const { posts, votedIds } = useShowcaseStore.getState()
      const top = topPostForTheme(posts, votedIds, 'postShed')
      expect(top?.id).toBe('seed-showcase-1') // baseVotes 32 is highest in postShed
    })

    it('respects the local vote when picking the winner', () => {
      useShowcaseStore.getState().hydrateSeed(SEED_POSTS)
      // seed-showcase-7 (8) trails seed-showcase-2 (27) within postShed; one vote
      // is not enough to overtake, so the winner stays seed-showcase-1 (32).
      useShowcaseStore.getState().toggleVote('seed-showcase-7')
      const { posts, votedIds } = useShowcaseStore.getState()
      expect(topPostForTheme(posts, votedIds, 'postShed')?.id).toBe('seed-showcase-1')
    })

    it('returns null when no post exists for the theme', () => {
      resetStore()
      const { posts, votedIds } = useShowcaseStore.getState()
      expect(topPostForTheme(posts, votedIds, 'baby')).toBeNull()
    })
  })
})
