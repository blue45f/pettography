import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class JoinRoomDto extends createZodDto(
  z.object({
    vetId: z.string().min(1, '수의사 ID가 필요합니다.'),
  }),
) {}
