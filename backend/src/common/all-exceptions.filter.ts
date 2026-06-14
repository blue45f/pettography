import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import type { Request, Response } from 'express'
import { Logger } from 'nestjs-pino'

/**
 * 글로벌 예외 필터.
 *
 * 에러 응답 envelope 는 NestJS 기본 형태와 역호환을 유지한다:
 * - HttpException: getResponse() 결과를 그대로 펼친다(객체면 statusCode/message/error 보존,
 *   문자열이면 { statusCode, message } 로 감싼다).
 * - 그 외(미처리) 예외: { statusCode: 500, message: 'Internal server error' }.
 * 그 위에 `path` 와 `timestamp` 만 ADD 한다 — 프론트가 읽던 message/statusCode 는 절대 변형하지 않는다.
 *
 * 5xx 는 pino(nestjs-pino) Logger 로 error 레벨 로깅한다.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const base = this.resolveBody(exception, status)

    const body = {
      ...base,
      path: request.url,
      timestamp: new Date().toISOString(),
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        {
          err: exception,
          statusCode: status,
          method: request.method,
          path: request.url,
        },
        `Unhandled ${status} on ${request.method} ${request.url}`
      )
    }

    response.status(status).json(body)
  }

  /**
   * 기본 NestJS envelope 를 보존하는 본문을 만든다.
   * - HttpException 객체 응답: 그 객체를 펼치고 statusCode 를 보장한다(message/error 보존).
   * - HttpException 문자열 응답: { statusCode, message } 로 감싼다.
   * - 미처리 예외: { statusCode: 500, message: 'Internal server error' }.
   */
  private resolveBody(
    exception: unknown,
    status: number
  ): Record<string, unknown> & { statusCode: number; message: unknown } {
    if (exception instanceof HttpException) {
      const payload = exception.getResponse()

      if (typeof payload === 'string') {
        return { statusCode: status, message: payload }
      }

      if (payload !== null && typeof payload === 'object') {
        const record = payload as Record<string, unknown>
        return {
          ...record,
          statusCode: typeof record.statusCode === 'number' ? record.statusCode : status,
          message: 'message' in record ? record.message : exception.message,
        }
      }
    }

    return { statusCode: status, message: 'Internal server error' }
  }
}
