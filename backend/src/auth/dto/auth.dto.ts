import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export class RegisterDto extends createZodDto(
  z.object({
    email: z
      .string()
      .min(1, '이메일을 입력해주세요.')
      .email('이메일 형식이 올바르지 않습니다.')
      .max(320, '이메일은 320자 이하로 입력해주세요.'),
    name: z.string().min(1, '이름을 입력해주세요.').max(80, '이름은 80자 이하로 입력해주세요.'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .max(128, '비밀번호는 128자 이하로 입력해주세요.'),
  })
) {}

export class LoginDto extends createZodDto(
  z.object({
    email: z
      .string()
      .min(1, '이메일을 입력해주세요.')
      .email('이메일 형식이 올바르지 않습니다.')
      .max(320, '이메일은 320자 이하로 입력해주세요.'),
    password: z
      .string()
      .min(1, '비밀번호를 입력해주세요.')
      .max(128, '비밀번호는 128자 이하로 입력해주세요.'),
  })
) {}

export class UpdateProfileDto extends createZodDto(
  z.object({
    name: z
      .string()
      .min(1, '이름을 입력해주세요.')
      .max(80, '이름은 80자 이하로 입력해주세요.')
      .optional(),
    currentPassword: z.string().min(8).max(128).optional(),
    newPassword: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .max(128, '비밀번호는 128자 이하로 입력해주세요.')
      .optional(),
  })
) {}

export class WithdrawAccountDto extends createZodDto(
  z.object({
    password: z
      .string()
      .min(1, '비밀번호를 입력해주세요.')
      .max(128, '비밀번호는 128자 이하로 입력해주세요.'),
  })
) {}
