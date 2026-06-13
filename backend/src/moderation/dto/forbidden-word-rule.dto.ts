import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import type { ForbiddenWordAction, ForbiddenWordMatchType } from '../../common/types';

const FORBIDDEN_WORD_ACTIONS = [
  'block',
  'review',
] as const satisfies readonly ForbiddenWordAction[];
const FORBIDDEN_WORD_MATCH_TYPES = [
  'contains',
  'whole_word',
] as const satisfies readonly ForbiddenWordMatchType[];

export class CreateForbiddenWordRuleDto extends createZodDto(
  z.object({
    phrase: z
      .string()
      .min(1, '금지어를 입력해주세요.')
      .max(80, '금지어는 80자 이하로 입력해주세요.'),
    action: z.enum(FORBIDDEN_WORD_ACTIONS, { error: '처리 방식이 유효하지 않습니다.' }),
    matchType: z.enum(FORBIDDEN_WORD_MATCH_TYPES, { error: '매칭 방식이 유효하지 않습니다.' }),
    enabled: z.boolean().optional(),
    note: z.string().max(240, '메모는 240자 이하로 입력해주세요.').optional(),
  }),
) {}

export class UpdateForbiddenWordRuleDto extends createZodDto(
  z.object({
    phrase: z.string().min(1).max(80, '금지어는 80자 이하로 입력해주세요.').optional(),
    action: z.enum(FORBIDDEN_WORD_ACTIONS).optional(),
    matchType: z.enum(FORBIDDEN_WORD_MATCH_TYPES).optional(),
    enabled: z.boolean().optional(),
    note: z.string().max(240, '메모는 240자 이하로 입력해주세요.').nullish(),
  }),
) {}
