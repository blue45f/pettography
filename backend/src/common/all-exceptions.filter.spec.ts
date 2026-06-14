import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common'
import type { ArgumentsHost } from '@nestjs/common'
import type { Logger } from 'nestjs-pino'
import { AllExceptionsFilter } from './all-exceptions.filter'

interface CapturedResponse {
  statusCode?: number
  body?: Record<string, unknown>
}

function createHost(
  method = 'GET',
  url = '/api/species'
): {
  host: ArgumentsHost
  captured: CapturedResponse
} {
  const captured: CapturedResponse = {}
  const response = {
    status(code: number) {
      captured.statusCode = code
      return this
    },
    json(payload: Record<string, unknown>) {
      captured.body = payload
      return this
    },
  }
  const request = { url, method }

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost

  return { host, captured }
}

describe('AllExceptionsFilter', () => {
  let logger: { error: jest.Mock }
  let filter: AllExceptionsFilter

  beforeEach(() => {
    logger = { error: jest.fn() }
    filter = new AllExceptionsFilter(logger as unknown as Logger)
  })

  it('preserves statusCode + string message and adds path/timestamp', () => {
    const { host, captured } = createHost('GET', '/api/species/missing')
    filter.catch(new HttpException('Not Found', HttpStatus.NOT_FOUND), host)

    expect(captured.statusCode).toBe(404)
    expect(captured.body).toMatchObject({
      statusCode: 404,
      message: 'Not Found',
      path: '/api/species/missing',
    })
    expect(typeof captured.body?.timestamp).toBe('string')
  })

  it('preserves the object envelope (statusCode/message/error) from BadRequestException', () => {
    const { host, captured } = createHost('POST', '/api/forum')
    filter.catch(new BadRequestException(['name is required']), host)

    expect(captured.statusCode).toBe(400)
    expect(captured.body).toMatchObject({
      statusCode: 400,
      message: ['name is required'],
      error: 'Bad Request',
      path: '/api/forum',
    })
  })

  it('maps unknown errors to a 500 envelope without leaking internals and logs them', () => {
    const { host, captured } = createHost('GET', '/api/boom')
    filter.catch(new Error('db exploded'), host)

    expect(captured.statusCode).toBe(500)
    expect(captured.body).toMatchObject({
      statusCode: 500,
      message: 'Internal server error',
      path: '/api/boom',
    })
    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  it('does not log 4xx exceptions', () => {
    const { host } = createHost('GET', '/api/species')
    filter.catch(new HttpException('Forbidden', HttpStatus.FORBIDDEN), host)

    expect(logger.error).not.toHaveBeenCalled()
  })

  it('logs 5xx HttpExceptions', () => {
    const { host } = createHost('GET', '/api/species')
    filter.catch(new HttpException('Bad Gateway', HttpStatus.BAD_GATEWAY), host)

    expect(logger.error).toHaveBeenCalledTimes(1)
  })
})
