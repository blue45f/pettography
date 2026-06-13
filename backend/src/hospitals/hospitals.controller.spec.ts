import { Test, TestingModule } from '@nestjs/testing'
import { HospitalsController } from './hospitals.controller'
import { HospitalsService } from './hospitals.service'

describe('HospitalsController', () => {
  let controller: HospitalsController

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HospitalsController],
      providers: [HospitalsService],
    }).compile()

    controller = moduleRef.get(HospitalsController)
  })

  describe('GET /hospitals', () => {
    it('returns hospitals list', () => {
      const result = controller.findAll({})
      expect(result.length).toBeGreaterThanOrEqual(6)
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('lat')
      expect(result[0]).toHaveProperty('lng')
    })

    it('filters by supported category', () => {
      const result = controller.findAll({ category: 'reptile' })
      expect(result.length).toBeGreaterThan(0)
      expect(result.every((h) => h.supportedCategories.includes('reptile'))).toBe(true)
    })

    it('computes distanceKm and sorts ascending when lat/lng given', () => {
      const result = controller.findAll({ lat: 37.5145, lng: 127.106 })
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('distanceKm')
      expect(typeof result[0].distanceKm).toBe('number')
      // ensure sorted ascending
      for (let i = 1; i < result.length; i++) {
        expect(result[i].distanceKm! >= result[i - 1].distanceKm!).toBe(true)
      }
    })

    it('respects radiusKm filter', () => {
      const result = controller.findAll({ lat: 37.5145, lng: 127.106, radiusKm: 2 })
      expect(result.every((h) => (h.distanceKm ?? Infinity) <= 2)).toBe(true)
    })
  })

  describe('GET /hospitals/:id', () => {
    it('returns hospital by id', () => {
      const result = controller.findOne('hp-001')
      expect(result.id).toBe('hp-001')
    })

    it('throws NotFoundException for unknown id', () => {
      expect(() => controller.findOne('hp-999')).toThrow(/not found/i)
    })
  })
})
