import { Test, TestingModule } from '@nestjs/testing';
import { CompareController } from './compare.controller';
import { CompareService } from './compare.service';

describe('CompareController', () => {
  let controller: CompareController;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [CompareController],
      providers: [CompareService],
    }).compile();

    controller = moduleRef.get(CompareController);
  });

  describe('GET /compare/dimensions', () => {
    it('returns the comparison dimension metadata', () => {
      const result = controller.findDimensions();
      expect(result.length).toBeGreaterThanOrEqual(9);
      for (const dim of result) {
        expect(dim).toHaveProperty('key');
        expect(dim).toHaveProperty('label');
        expect(dim).toHaveProperty('type');
        expect(typeof dim.key).toBe('string');
        expect(typeof dim.label).toBe('string');
        expect(typeof dim.type).toBe('string');
      }
      const keys = result.map((d) => d.key);
      expect(keys).toEqual(
        expect.arrayContaining([
          'category',
          'difficulty',
          'lifespan',
          'space',
          'handling',
          'activity',
          'budget',
          'beginnerTip',
          'commonProblem',
        ]),
      );
    });
  });
});
