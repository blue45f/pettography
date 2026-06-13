import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class CreateReplyDto extends createZodDto(
  z.object({
    author: z
      .string()
      .min(1, '작성자를 입력해주세요.')
      .max(40, '작성자는 40자 이하로 입력해주세요.'),
    body: z.string().min(1, '본문을 입력해주세요.').max(800, '본문은 800자 이하로 입력해주세요.'),
  }),
) {}
