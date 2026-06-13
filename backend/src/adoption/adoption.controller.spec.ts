import { Test, TestingModule } from '@nestjs/testing'
import { AdoptionController } from './adoption.controller'
import { AdoptionService } from './adoption.service'

describe('AdoptionController', () => {
  let controller: AdoptionController

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AdoptionController],
      providers: [AdoptionService],
    }).compile()

    controller = moduleRef.get(AdoptionController)
  })

  describe('GET /adoption', () => {
    it('returns all adoption listings when no filter is provided', () => {
      const result = controller.findAll({})
      expect(result.length).toBeGreaterThanOrEqual(8)
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('url')
      expect(result[0]).toHaveProperty('kind')
      expect(result[0]).toHaveProperty('supportedCategories')
    })

    it('filters by supported category', () => {
      const result = controller.findAll({ category: 'reptile' })
      expect(result.length).toBeGreaterThan(0)
      expect(result.every((a) => a.supportedCategories.includes('reptile'))).toBe(true)
    })
  })
})
