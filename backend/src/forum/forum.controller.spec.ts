import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '../auth/auth.guard'
import { AuthService } from '../auth/auth.service'
import { resetStateStoresForTest } from '../common/json-store'
import { ModerationService } from '../moderation/moderation.service'
import { ForumController } from './forum.controller'
import { ForumService } from './forum.service'

describe('ForumController', () => {
  let controller: ForumController
  let moderation: ModerationService

  beforeEach(async () => {
    resetStateStoresForTest()
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ForumController],
      providers: [ForumService, ModerationService, AuthService, AuthGuard, Reflector],
    }).compile()

    controller = moduleRef.get(ForumController)
    moderation = moduleRef.get(ModerationService)
  })

  describe('GET /forum/posts', () => {
    it('returns all seeded posts when no filter is provided', () => {
      const result = controller.findAllPosts({})
      expect(result.length).toBeGreaterThanOrEqual(3)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('category')
      expect(result[0]).toHaveProperty('title')
      expect(result[0]).toHaveProperty('author')
      expect(result[0]).toHaveProperty('body')
      expect(result[0]).toHaveProperty('createdAt')
    })

    it('filters by category', () => {
      const result = controller.findAllPosts({ category: 'reptile' })
      expect(result.length).toBeGreaterThan(0)
      expect(result.every((p) => p.category === 'reptile')).toBe(true)
    })

    it('marks posts for review when review rules match', () => {
      moderation.createForbiddenWord({
        phrase: '리뷰필요',
        action: 'review',
        matchType: 'contains',
      })

      const reviewed = controller.createPost({
        category: 'reptile',
        title: '리뷰필요 제목',
        author: '테스터',
        body: '일반 본문',
      })

      expect(reviewed.moderationStatus).toBe('needs_review')
      expect(reviewed.moderationHits).toEqual(['리뷰필요'])
    })

    it('rejects posts when block rules match', () => {
      moderation.createForbiddenWord({
        phrase: '차단어',
        action: 'block',
        matchType: 'contains',
      })

      expect(() =>
        controller.createPost({
          category: 'bird',
          title: '앵무새 질문',
          author: '테스터',
          body: '차단어 포함',
        })
      ).toThrow(BadRequestException)
    })
  })

  describe('GET /forum/posts/:id', () => {
    it('returns post + replies bundle for an existing post', () => {
      const result = controller.findOnePost('seed-post-1')
      expect(result.post.id).toBe('seed-post-1')
      expect(Array.isArray(result.replies)).toBe(true)
      expect(result.replies.length).toBeGreaterThan(0)
      expect(result.replies[0]).toHaveProperty('postId', 'seed-post-1')
    })
  })

  describe('POST /forum/posts', () => {
    it('creates a new post at the head of the list', () => {
      const created = controller.createPost({
        category: 'amphibian',
        title: '아홀로틀 물갈이 주기',
        author: '도롱뇽지킴이',
        body: '40L 단독 사육 시 주 1회 30% 환수가 적당할까요?',
      })
      expect(created.id).toBeTruthy()
      expect(created.category).toBe('amphibian')
      expect(created.createdAt).toBeTruthy()

      const list = controller.findAllPosts({})
      expect(list[0].id).toBe(created.id)
    })
  })

  describe('POST /forum/posts/:id/replies', () => {
    it('creates a reply attached to the post', () => {
      const reply = controller.createReply('seed-post-2', {
        author: '버드러버',
        body: '저는 평일 30분이면 충분하다고 봐요.',
      })
      expect(reply.id).toBeTruthy()
      expect(reply.postId).toBe('seed-post-2')

      const { replies } = controller.findOnePost('seed-post-2')
      expect(replies.find((r) => r.id === reply.id)).toBeDefined()
    })
  })
})
