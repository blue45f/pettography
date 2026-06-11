import { beforeEach, describe, expect, it } from 'vitest'

import { buildCommentThreads, removeCommentFromList } from './schema'
import { cafeMemberCount, useCafesStore } from './store'

import type { CafeComment } from './schema'

function comment(id: string, parentCommentId: string | null, createdAt: string): CafeComment {
  return {
    id,
    postId: 'post-1',
    parentCommentId,
    author: 'tester',
    body: `body-${id}`,
    createdAt,
    deleted: false,
  }
}

describe('buildCommentThreads', () => {
  it('groups answers under their root, sorted by time', () => {
    const threads = buildCommentThreads([
      comment('root-b', null, '2026-06-02T00:00:00.000Z'),
      comment('root-a', null, '2026-06-01T00:00:00.000Z'),
      comment('child-1', 'root-a', '2026-06-03T00:00:00.000Z'),
    ])
    expect(threads.map((t) => t.comment.id)).toEqual(['root-a', 'root-b'])
    expect(threads[0].children.map((c) => c.id)).toEqual(['child-1'])
  })

  it('flattens deeper chains onto the root (single-level threads)', () => {
    const threads = buildCommentThreads([
      comment('root', null, '2026-06-01T00:00:00.000Z'),
      comment('child', 'root', '2026-06-02T00:00:00.000Z'),
      comment('grandchild', 'child', '2026-06-03T00:00:00.000Z'),
    ])
    expect(threads).toHaveLength(1)
    expect(threads[0].children.map((c) => c.id)).toEqual(['child', 'grandchild'])
  })

  it('promotes orphaned answers to their own thread', () => {
    const threads = buildCommentThreads([comment('child', 'gone', '2026-06-02T00:00:00.000Z')])
    expect(threads).toHaveLength(1)
    expect(threads[0].comment.id).toBe('child')
  })
})

describe('removeCommentFromList', () => {
  it('keeps a placeholder for roots that still have answers', () => {
    const list = [
      comment('root', null, '2026-06-01T00:00:00.000Z'),
      comment('child', 'root', '2026-06-02T00:00:00.000Z'),
    ]
    const next = removeCommentFromList(list, 'root')
    expect(next.find((c) => c.id === 'root')?.deleted).toBe(true)
    expect(next).toHaveLength(2)
  })

  it('drops the placeholder once the last answer is removed', () => {
    const list = [
      { ...comment('root', null, '2026-06-01T00:00:00.000Z'), deleted: true, body: '' },
      comment('child', 'root', '2026-06-02T00:00:00.000Z'),
    ]
    expect(removeCommentFromList(list, 'child')).toHaveLength(0)
  })
})

describe('useCafesStore', () => {
  beforeEach(() => {
    useCafesStore.setState({
      cafes: [],
      posts: {},
      comments: {},
      joinedCafeIds: {},
      ownCafeIds: {},
      ownPostIds: {},
      ownCommentIds: {},
      lastNickname: '',
    })
  })

  function createCafe() {
    return useCafesStore.getState().createCafe({
      name: '볼파이톤 연구회',
      description: '볼파이톤 온습도와 거식 대응을 나누는 모임입니다.',
      speciesId: 'sp-ball-python',
      speciesName: '볼파이톤',
      category: 'reptile',
      emoji: '🐍',
      createdBy: '파이톤집사',
    })
  }

  it('creating a cafe auto-joins the creator and remembers the nickname', () => {
    const cafe = createCafe()
    const state = useCafesStore.getState()
    expect(state.joinedCafeIds[cafe.id]).toBe(true)
    expect(state.ownCafeIds[cafe.id]).toBe(true)
    expect(state.lastNickname).toBe('파이톤집사')
    expect(cafeMemberCount(cafe, true)).toBe(1)
  })

  it('join/leave toggles membership', () => {
    const cafe = createCafe()
    useCafesStore.getState().leaveCafe(cafe.id)
    expect(useCafesStore.getState().joinedCafeIds[cafe.id]).toBeUndefined()
    useCafesStore.getState().joinCafe(cafe.id)
    expect(useCafesStore.getState().joinedCafeIds[cafe.id]).toBe(true)
  })

  it('flattens nested replies onto the root comment at write time', () => {
    const cafe = createCafe()
    const post = useCafesStore.getState().addPost({
      cafeId: cafe.id,
      title: '거식 3주차',
      author: '파이톤집사',
      body: '온도 점검까지 끝냈는데 거식이 길어집니다.',
    })
    const root = useCafesStore
      .getState()
      .addComment({ postId: post.id, author: 'helper', body: '핫스팟 32도 확인하세요.' })
    const child = useCafesStore.getState().addComment({
      postId: post.id,
      parentCommentId: root.id,
      author: '파이톤집사',
      body: '확인했어요!',
    })
    const grandchild = useCafesStore.getState().addComment({
      postId: post.id,
      parentCommentId: child.id,
      author: 'helper',
      body: '그럼 먹이 종류를 바꿔보세요.',
    })
    expect(grandchild.parentCommentId).toBe(root.id)
  })

  it('admin can archive a cafe and hide a post without destroying data', () => {
    const cafe = createCafe()
    const post = useCafesStore
      .getState()
      .addPost({ cafeId: cafe.id, title: '글', author: 'a', body: '본문입니다 본문입니다' })
    useCafesStore.getState().setCafeArchived(cafe.id, true)
    useCafesStore.getState().setPostHiddenByAdmin(cafe.id, post.id, true)
    const state = useCafesStore.getState()
    expect(state.cafes[0].archivedByAdmin).toBe(true)
    expect(state.posts[cafe.id][0].hiddenByAdmin).toBe(true)
  })

  it('removing a cafe cascades posts, comments and membership', () => {
    const cafe = createCafe()
    const post = useCafesStore
      .getState()
      .addPost({ cafeId: cafe.id, title: '글', author: 'a', body: '본문입니다 본문입니다' })
    useCafesStore.getState().addComment({ postId: post.id, author: 'b', body: '댓글' })
    useCafesStore.getState().removeCafe(cafe.id)
    const state = useCafesStore.getState()
    expect(state.cafes).toHaveLength(0)
    expect(state.posts[cafe.id]).toBeUndefined()
    expect(state.comments[post.id]).toBeUndefined()
    expect(state.joinedCafeIds[cafe.id]).toBeUndefined()
  })
})
