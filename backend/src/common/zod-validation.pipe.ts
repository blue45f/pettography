import { BadRequestException } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import type { ZodError } from 'zod';

/**
 * 전역 Zod 검증 파이프.
 * 기존 class-validator 응답({ statusCode, message: string[], error })과 동일한 형태를 유지해
 * 프론트엔드 에러 메시지 처리에 영향을 주지 않는다.
 * nestjs-zod 의 ZodExceptionCreator 시그니처는 (error: unknown) => Error 이므로 ZodError 로 좁힌다.
 */
export const ZodValidationPipe = createZodValidationPipe({
  createValidationException: (error) =>
    new BadRequestException((error as ZodError).issues.map((issue) => issue.message)),
});
