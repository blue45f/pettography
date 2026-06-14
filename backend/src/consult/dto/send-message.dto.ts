import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export class SendMessageDto extends createZodDto(
  z.object({
    vetId: z.string().min(1, '수의사 ID가 필요합니다.'),
    body: z
      .string()
      .min(1, '메시지를 입력해주세요.')
      .max(2000, '메시지는 2000자 이하로 입력해주세요.'),
  })
) {}
