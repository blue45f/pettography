import { Test, TestingModule } from '@nestjs/testing';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';

describe('PartnersController', () => {
  let controller: PartnersController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PartnersController],
      providers: [PartnersService],
    }).compile();

    controller = moduleRef.get(PartnersController);
  });

  describe('GET /partners', () => {
    it('returns all seeded applications when no filter is provided', () => {
      const result = controller.findAll({});
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('kind');
      expect(result[0]).toHaveProperty('status');
      expect(result[0]).toHaveProperty('createdAt');
    });

    it('filters by status', () => {
      const result = controller.findAll({ status: 'approved' });
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((a) => a.status === 'approved')).toBe(true);
    });
  });

  describe('POST /partners', () => {
    it('creates a new application with pending status and url defaulted to null', () => {
      const created = controller.create({
        kind: 'shop',
        name: '송파파충류용품',
        contact: '02-1234-5678',
        region: '서울 송파구',
        description: '레오파드 게코·볼파이톤 용품 전문 신규 입점 신청합니다.',
      });
      expect(created.id).toBeTruthy();
      expect(created.status).toBe('pending');
      expect(created.url).toBeNull();
      expect(created.createdAt).toBeTruthy();

      const list = controller.findAll({});
      expect(list[0].id).toBe(created.id);
    });
  });
});
