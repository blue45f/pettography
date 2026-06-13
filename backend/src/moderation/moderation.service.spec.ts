import { BadRequestException, ConflictException } from '@nestjs/common';
import { resetStateStoresForTest } from '../common/json-store';
import { ModerationService } from './moderation.service';

describe('ModerationService', () => {
  let service: ModerationService;

  beforeEach(() => {
    resetStateStoresForTest();
    service = new ModerationService();
  });

  it('blocks content that matches enabled block rules', () => {
    service.createForbiddenWord({
      phrase: 'blocked phrase',
      action: 'block',
      matchType: 'contains',
    });

    expect(service.evaluate(['This has a blocked phrase.'])).toEqual({
      action: 'block',
      hits: ['blocked phrase'],
    });
  });

  it('marks content for review when only review rules match', () => {
    service.createForbiddenWord({
      phrase: 'watch',
      action: 'review',
      matchType: 'whole_word',
    });

    expect(service.evaluate(['Please watch this thread.'])).toEqual({
      action: 'review',
      hits: ['watch'],
    });
    expect(service.evaluate(['watchful text'])).toEqual({ action: 'allow', hits: [] });
  });

  it('ignores disabled rules and rejects duplicate phrases', () => {
    const rule = service.createForbiddenWord({
      phrase: 'duplicate',
      action: 'block',
      matchType: 'contains',
      enabled: false,
    });

    expect(service.evaluate(['duplicate'])).toEqual({ action: 'allow', hits: [] });
    expect(() =>
      service.createForbiddenWord({
        phrase: ' duplicate ',
        action: 'review',
        matchType: 'contains',
      }),
    ).toThrow(ConflictException);

    service.updateForbiddenWord(rule.id, { enabled: true });
    expect(service.evaluate(['duplicate'])).toEqual({
      action: 'block',
      hits: ['duplicate'],
    });
  });

  it('rejects blank phrases after normalization', () => {
    expect(() =>
      service.createForbiddenWord({
        phrase: '   ',
        action: 'block',
        matchType: 'contains',
      }),
    ).toThrow(BadRequestException);
  });
});
