import { Test, TestingModule } from '@nestjs/testing';
import { SpeciesController } from './species.controller';
import { SpeciesService } from './species.service';

describe('SpeciesController', () => {
  let controller: SpeciesController;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SpeciesController],
      providers: [SpeciesService],
    }).compile();

    controller = moduleRef.get(SpeciesController);
  });

  describe('GET /species', () => {
    it('returns all species when no filter is provided', () => {
      const result = controller.findAll({});
      expect(result.length).toBeGreaterThanOrEqual(16);
      expect(result[0]).toHaveProperty('koreanName');
      expect(result[0]).toHaveProperty('scientificName');
    });

    it('filters by category', () => {
      const result = controller.findAll({ category: 'reptile' });
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((s) => s.category === 'reptile')).toBe(true);
    });

    it('filters by difficulty', () => {
      const result = controller.findAll({ difficulty: 'beginner' });
      expect(result.every((s) => s.difficulty === 'beginner')).toBe(true);
    });

    it('searches Korean name via q', () => {
      const result = controller.findAll({ q: '레오파드' });
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].koreanName).toContain('레오파드');
    });
  });

  describe('GET /species/:idOrSlug', () => {
    it('returns species by slug', () => {
      const result = controller.findOne('leopard-gecko');
      expect(result.slug).toBe('leopard-gecko');
      expect(result.koreanName).toBe('레오파드 게코');
    });

    it('returns species by id', () => {
      const result = controller.findOne('sp-leopard-gecko');
      expect(result.id).toBe('sp-leopard-gecko');
    });

    it('throws NotFoundException for unknown id/slug', () => {
      expect(() => controller.findOne('does-not-exist')).toThrow(/not found/i);
    });
  });
});
