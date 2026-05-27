import { Test, TestingModule } from '@nestjs/testing';
import { FuneralController } from './funeral.controller';
import { FuneralService } from './funeral.service';

describe('FuneralController', () => {
  let controller: FuneralController;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [FuneralController],
      providers: [FuneralService],
    }).compile();

    controller = moduleRef.get(FuneralController);
  });

  describe('GET /funeral', () => {
    it('returns all funeral services when no filter is provided', () => {
      const result = controller.findAll({});
      expect(result.length).toBeGreaterThanOrEqual(6);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('url');
      expect(result[0]).toHaveProperty('kind');
      expect(result[0]).toHaveProperty('certified');
    });

    it('filters by supported category', () => {
      const result = controller.findAll({ category: 'mammal' });
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((f) => f.supportedCategories.includes('mammal'))).toBe(true);
    });
  });
});
