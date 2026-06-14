import { Test, TestingModule } from '@nestjs/testing'
import { RegistryController } from './registry.controller'
import { RegistryService } from './registry.service'

describe('RegistryController', () => {
  let controller: RegistryController

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [RegistryController],
      providers: [RegistryService],
    }).compile()

    controller = moduleRef.get(RegistryController)
  })

  describe('GET /registry/filings', () => {
    it('returns all four wildlife filings with required metadata', () => {
      const result = controller.findFilings()
      expect(result).toHaveLength(4)
      const keys = result.map((f) => f.key)
      expect(keys).toEqual(expect.arrayContaining(['keeping', 'transfer', 'death', 'microchip']))
      for (const filing of result) {
        expect(filing).toHaveProperty('title')
        expect(filing).toHaveProperty('description')
        expect(filing).toHaveProperty('dueWindowDays')
        expect(filing).toHaveProperty('officialUrl')
        expect(typeof filing.dueWindowDays).toBe('number')
        expect(filing.officialUrl).toMatch(/^https?:\/\//)
      }
    })
  })

  describe('GET /registry/regulated-categories', () => {
    it('returns the four regulated species categories', () => {
      const result = controller.findRegulatedCategories()
      expect(result).toEqual(['reptile', 'amphibian', 'bird', 'mammal'])
    })
  })

  describe('GET /registry/links', () => {
    it('returns the wildlife, animal, and ministry links', () => {
      const result = controller.findLinks()
      expect(result).toHaveProperty('wildlifeRegistry')
      expect(result).toHaveProperty('animalRegistry')
      expect(result).toHaveProperty('envMinistry')
      expect(result.wildlifeRegistry).toMatch(/^https?:\/\//)
      expect(result.animalRegistry).toMatch(/^https?:\/\//)
      expect(result.envMinistry).toMatch(/^https?:\/\//)
    })
  })
})
