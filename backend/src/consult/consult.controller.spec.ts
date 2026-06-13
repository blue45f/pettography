import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ConsultController } from './consult.controller'
import { ConsultService } from './consult.service'

describe('ConsultController', () => {
  let controller: ConsultController
  let service: ConsultService

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ConsultController],
      providers: [ConsultService],
    }).compile()

    controller = moduleRef.get(ConsultController)
    service = moduleRef.get(ConsultService)
  })

  describe('GET /consult/vets', () => {
    it('returns at least the seeded roster', () => {
      const vets = controller.listVets()
      expect(vets.length).toBeGreaterThanOrEqual(5)
      expect(vets[0]).toHaveProperty('id')
      expect(vets[0]).toHaveProperty('name')
      expect(vets[0]).toHaveProperty('status')
    })
  })

  describe('GET /consult/vets/:id', () => {
    it('returns a seeded vet by id', () => {
      const vet = controller.getVet('vet-songpa-park')
      expect(vet.name).toBe('박지영 수의사')
    })

    it('throws 404 for unknown vet id', () => {
      expect(() => controller.getVet('vet-unknown')).toThrow(NotFoundException)
    })
  })

  describe('GET /consult/vets/:id/messages', () => {
    it('returns the empty thread by default', () => {
      const messages = controller.listMessages('vet-bundang-han')
      expect(messages).toEqual([])
    })

    it('returns appended user message after service writes one', () => {
      service.appendMessage('vet-bundang-han', 'user', '인사드립니다')
      const messages = controller.listMessages('vet-bundang-han')
      expect(messages.length).toBe(1)
      expect(messages[0]).toMatchObject({
        vetId: 'vet-bundang-han',
        role: 'user',
        body: '인사드립니다',
      })
    })
  })

  describe('POST /consult/vets/:id/messages', () => {
    afterEach(() => {
      jest.useRealTimers()
    })

    it('appends and returns the user message', () => {
      jest.useFakeTimers()
      const message = controller.createMessage('vet-songpa-park', { body: '발가락 탈피 문의' })
      expect(message).toMatchObject({
        vetId: 'vet-songpa-park',
        role: 'user',
        body: '발가락 탈피 문의',
      })
      expect(controller.listMessages('vet-songpa-park')).toHaveLength(1)
    })

    it('schedules the vet auto-reply for pollers', () => {
      jest.useFakeTimers()
      controller.createMessage('vet-mapo-kang', { body: '응급 상담 가능한가요?' })
      jest.advanceTimersByTime(700)
      const messages = controller.listMessages('vet-mapo-kang')
      expect(messages).toHaveLength(2)
      expect(messages[1].role).toBe('vet')
      expect(messages[1].body).toContain('강민서 수의사')
    })

    it('throws 404 for an unknown vet id', () => {
      expect(() => controller.createMessage('vet-unknown', { body: '안녕하세요' })).toThrow(
        NotFoundException
      )
    })
  })
})
