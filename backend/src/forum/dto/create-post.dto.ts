import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import type { SpeciesCategory } from '../../common/types'

const SPECIES_CATEGORIES = [
  'reptile',
  'arthropod',
  'bird',
  'amphibian',
  'mammal',
] as const satisfies readonly SpeciesCategory[]

export class CreatePostDto extends createZodDto(
  z.object({
    category: z.enum(SPECIES_CATEGORIES, { error: '카테고리가 유효하지 않습니다.' }),
    title: z.string().min(1, '제목을 입력해주세요.').max(120, '제목은 120자 이하로 입력해주세요.'),
    author: z
      .string()
      .min(1, '작성자를 입력해주세요.')
      .max(40, '작성자는 40자 이하로 입력해주세요.'),
    body: z.string().min(1, '본문을 입력해주세요.').max(2000, '본문은 2000자 이하로 입력해주세요.'),
  })
) {}
