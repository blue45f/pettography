import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import type { PartnerKind } from '../../common/types';

const PARTNER_KINDS = ['shop', 'hospital', 'treat-shop'] as const satisfies readonly PartnerKind[];

export class CreatePartnerDto extends createZodDto(
  z.object({
    kind: z.enum(PARTNER_KINDS, { error: '제휴 유형이 유효하지 않습니다.' }),
    name: z.string().min(1, '이름을 입력해주세요.').max(80, '이름은 80자 이하로 입력해주세요.'),
    contact: z
      .string()
      .min(1, '연락처를 입력해주세요.')
      .max(80, '연락처는 80자 이하로 입력해주세요.'),
    region: z.string().min(1, '지역을 입력해주세요.').max(80, '지역은 80자 이하로 입력해주세요.'),
    description: z
      .string()
      .min(1, '소개를 입력해주세요.')
      .max(1000, '소개는 1000자 이하로 입력해주세요.'),
    // 빈 문자열·null 은 미입력으로 허용하고, 값이 있으면 프로토콜 포함 URL 이어야 한다.
    url: z.union([z.url('유효한 URL을 입력해주세요.'), z.literal('')]).nullish(),
  }),
) {}
