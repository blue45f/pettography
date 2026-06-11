import { beforeEach, describe, expect, it } from 'vitest'

import { removeReplyFromList } from './schema'
import { useForumStore } from './store'

import type { ForumReply } from './schema'
import type { Attachment } from '@features/attachments'

const attachment: Attachment = {
  id: 'att-1',
  kind: 'image',
  name: 'shed.jpg',
  mimeType: 'image/jpeg',
  bytes: 1000,
  dataUrl: 'data:image/jpeg;base64,Zm9v',
  width: 10,
  height: 10,
}

function reply(id: string, parentReplyId: string | null, deleted = false): ForumReply {
  return {
    id,
    postId: 'post-1',
    parentReplyId,
    author: 'tester',
    body: deleted ? '' : `body-${id}`,
    createdAt: `2026-06-01T00:0${id.length}:00.000Z`,
    reportCount: 0,
    autoHidden: false,
    deleted,
  }
}

describe('removeReplyFromList', () => {
  it('hard-removes a leaf reply', () => {
    const list = [reply('a', null), reply('b', 'a')]
    const next = removeReplyFromList(list, 'b')
    expect(next.map((r) => r.id)).toEqual(['a'])
  })

  it('collapses a parent with children into a deleted placeholder', () => {
    const list = [reply('a', null), reply('b', 'a')]
    const next = removeReplyFromList(list, 'a')
    expect(next).toHaveLength(2)
    const placeholder = next.find((r) => r.id === 'a')
    expect(placeholder?.deleted).toBe(true)
    expect(placeholder?.body).toBe('')
    expect(next.find((r) => r.id === 'b')?.deleted).toBe(false)
  })

  it('garbage-collects placeholder chains once the last child is removed', () => {
    const list = [reply('a', null, true), reply('b', 'a')]
    const next = removeReplyFromList(list, 'b')
    expect(next).toHaveLength(0)
  })
})

describe('useForumStore moderation + attachments', () => {
  beforeEach(() => {
    useForumStore.getState().hydrateSeed([], {})
  })

  it('stores attachments with a new post', () => {
    const post = useForumStore.getState().addPost({
      category: 'reptile',
      title: '탈피 사진 공유',
      author: '잠실집사',
      body: '첫 탈피 기록 남깁니다.',
      attachments: [attachment],
    })
    expect(post.attachments).toHaveLength(1)
    expect(post.hiddenByAdmin).toBe(false)
  })

  it('lets an admin hide and restore a post without deleting it', () => {
    const post = useForumStore.getState().addPost({
      category: 'bird',
      title: '광고 글',
      author: 'spam',
      body: '스팸성 내용'.repeat(2),
    })
    useForumStore.getState().setPostHiddenByAdmin(post.id, true)
    expect(useForumStore.getState().posts.find((p) => p.id === post.id)?.hiddenByAdmin).toBe(true)
    useForumStore.getState().setPostHiddenByAdmin(post.id, false)
    expect(useForumStore.getState().posts.find((p) => p.id === post.id)?.hiddenByAdmin).toBe(false)
  })

  it('removes a single attachment from a post', () => {
    const post = useForumStore.getState().addPost({
      category: 'reptile',
      title: '사진 두 장',
      author: 'tester',
      body: '본문입니다 본문입니다',
      attachments: [attachment, { ...attachment, id: 'att-2', name: 'two.jpg' }],
    })
    useForumStore.getState().removePostAttachment(post.id, 'att-1')
    const updated = useForumStore.getState().posts.find((p) => p.id === post.id)
    expect(updated?.attachments.map((a) => a.id)).toEqual(['att-2'])
  })

  it('keeps a deleted placeholder when removing a reply that has answers', () => {
    const { addPost, addReply, removeReply } = useForumStore.getState()
    const post = addPost({
      category: 'reptile',
      title: '질문',
      author: 'asker',
      body: '질문 본문입니다',
    })
    const parent = addReply({ postId: post.id, author: 'helper', body: '답변' })
    addReply({ postId: post.id, parentReplyId: parent.id, author: 'asker', body: '감사' })

    removeReply(post.id, parent.id)
    const list = useForumStore.getState().replies[post.id]
    expect(list).toHaveLength(2)
    expect(list.find((r) => r.id === parent.id)?.deleted).toBe(true)
  })
})
