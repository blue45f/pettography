import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

/** REST body for POST /consult/vets/:id/messages — vetId comes from the path. */
export class PostMessageDto extends createZodDto(
  z.object({
    body: z
      .string()
      .min(1, '메시지를 입력해주세요.')
      .max(2000, '메시지는 2000자 이하로 입력해주세요.'),
  })
) {}
