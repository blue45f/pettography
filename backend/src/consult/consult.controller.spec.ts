import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConsultController } from './consult.controller';
import { ConsultService } from './consult.service';

describe('ConsultController', () => {
  let controller: ConsultController;
  let service: ConsultService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ConsultController],
      providers: [ConsultService],
    }).compile();

    controller = moduleRef.get(ConsultController);
    service = moduleRef.get(ConsultService);
  });

  describe('GET /consult/vets', () => {
    it('returns at least the seeded roster', () => {
      const vets = controller.listVets();
      expect(vets.length).toBeGreaterThanOrEqual(5);
      expect(vets[0]).toHaveProperty('id');
      expect(vets[0]).toHaveProperty('name');
      expect(vets[0]).toHaveProperty('status');
    });
  });

  describe('GET /consult/vets/:id', () => {
    it('returns a seeded vet by id', () => {
      const vet = controller.getVet('vet-songpa-park');
      expect(vet.name).toBe('박지영 수의사');
    });

    it('throws 404 for unknown vet id', () => {
      expect(() => controller.getVet('vet-unknown')).toThrow(NotFoundException);
    });
  });

  describe('GET /consult/vets/:id/messages', () => {
    it('returns the empty thread by default', () => {
      const messages = controller.listMessages('vet-bundang-han');
      expect(messages).toEqual([]);
    });

    it('returns appended user message after service writes one', () => {
      service.appendMessage('vet-bundang-han', 'user', '인사드립니다');
      const messages = controller.listMessages('vet-bundang-han');
      expect(messages.length).toBe(1);
      expect(messages[0]).toMatchObject({
        vetId: 'vet-bundang-han',
        role: 'user',
        body: '인사드립니다',
      });
    });
  });
});
