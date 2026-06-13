import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

import api, { ApiError, addRequestInterceptor, addResponseInterceptor } from './api'

function getRequestMeta(spy: { mock: { calls: unknown[][] } }, index = 0) {
  const [input, init] = spy.mock.calls[index] as [unknown, RequestInit | undefined]
  const request = input instanceof Request ? input : undefined

  return {
    url:
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (request?.url ?? ''),
    method: (init?.method ?? request?.method) as string | undefined,
    headers: init?.headers ?? request?.headers,
    init,
    request,
  }
}

function toHeaderRecord(headers?: HeadersInit | Headers): Record<string, string> {
  if (!headers) return {}
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries())
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers)
  }
  return { ...headers }
}

describe('api', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('GET 요청을 보낸다', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, name: 'test' }), { status: 200 }))

    const result = await api.get('/users/1')
    expect(result.data).toEqual({ id: 1, name: 'test' })
    expect(result.status).toBe(200)
    expect(getRequestMeta(fetchSpy).method).toBe('GET')
  })

  it('POST 요청을 보낸다', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 2 }), { status: 201 }))

    const result = await api.post('/users', { name: 'new' })
    expect(result.data).toEqual({ id: 2 })
    expect(getRequestMeta(fetchSpy).method).toBe('POST')
  })

  it('HTTP 에러를 ApiError로 변환한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 404 }))

    await expect(api.get('/not-found')).rejects.toThrow(ApiError)
    await expect(api.get('/not-found')).rejects.toThrow()
  })

  it('네트워크 에러를 처리한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    await expect(api.get('/fail')).rejects.toThrow(ApiError)
  })

  it('쿼리 파라미터를 추가한다', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))

    await api.get('/users', { params: { page: '1', limit: '10' } })

    expect(getRequestMeta(fetchSpy).url).toContain('page=1&limit=10')
  })

  it('요청 인터셉터를 실행한다', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))

    const remove = addRequestInterceptor((config) => ({
      ...config,
      headers: { ...(config.headers as Record<string, string>), 'X-Custom': 'test' },
    }))

    await api.get('/test')

    expect(toHeaderRecord(getRequestMeta(fetchSpy).headers)).toEqual(
      expect.objectContaining({
        'x-custom': 'test',
      }),
    )

    remove()
  })

  it('응답 인터셉터를 실행한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )

    const interceptor = vi.fn((res: Response) => res)
    const remove = addResponseInterceptor(interceptor)

    await api.get('/test')
    expect(interceptor).toHaveBeenCalled()

    remove()
  })

  it('PUT 요청을 보낸다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 3, updated: true }), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const result = await api.put('/users/3', { name: 'updated' })

    expect(result.data).toEqual({ id: 3, updated: true })
    expect(getRequestMeta(fetchMock).method).toBe('PUT')
    vi.unstubAllGlobals()
  })

  it('PATCH 요청을 보낸다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ patched: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await api.patch('/users/4', { name: 'patched' })

    expect(result.data).toEqual({ patched: true })
    expect(getRequestMeta(fetchMock).method).toBe('PATCH')
    vi.unstubAllGlobals()
  })

  it('PATCH 요청은 body 없이도 호출 가능하다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await api.patch('/users/5')

    expect(getRequestMeta(fetchMock).method).toBe('PATCH')
    vi.unstubAllGlobals()
  })

  it('PUT 요청은 body 없이도 호출 가능하다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await api.put('/users/6')

    expect(getRequestMeta(fetchMock).method).toBe('PUT')
    vi.unstubAllGlobals()
  })

  it('POST 요청은 body 없이도 호출 가능하다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await api.post('/no-body')

    expect(getRequestMeta(fetchMock).method).toBe('POST')
    vi.unstubAllGlobals()
  })

  it.each<[string, unknown, string]>([
    ['false', false, 'false'],
    ['0', 0, '0'],
    ['빈 문자열', '', '""'],
    ['null', null, 'null'],
  ])('POST 요청은 %s body를 누락하지 않고 직렬화한다', async (_label, body, serializedBody) => {
    let requestBody = ''
    const fetchMock = vi.fn().mockImplementation(async (input: unknown) => {
      const request = input instanceof Request ? input : undefined
      requestBody = request ? await request.text() : ''
      return new Response(JSON.stringify({}), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    await api.post('/falsy-body', body)

    expect(getRequestMeta(fetchMock).method).toBe('POST')
    expect(getRequestMeta(fetchMock).url).toContain('/falsy-body')
    expect(requestBody).toBe(serializedBody)
    vi.unstubAllGlobals()
  })

  it('DELETE 요청을 보낸다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ deleted: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await api.delete('/users/7')

    expect(result.data).toEqual({ deleted: true })
    expect(getRequestMeta(fetchMock).method).toBe('DELETE')
    vi.unstubAllGlobals()
  })

  it('params를 쿼리 문자열로 직렬화한다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await api.get('/search', { params: { q: 'hello world', page: '2' } })

    const calledUrl = getRequestMeta(fetchMock).url
    expect(calledUrl).toContain('/search?')
    expect(calledUrl).toContain('q=hello+world')
    expect(calledUrl).toContain('page=2')
    vi.unstubAllGlobals()
  })

  it('addRequestInterceptor가 반환한 함수로 인터셉터를 제거한다', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 })))
    vi.stubGlobal('fetch', fetchMock)

    const interceptor = vi.fn((config) => config)
    const remove = addRequestInterceptor(interceptor)

    await api.get('/test')
    expect(interceptor).toHaveBeenCalledTimes(1)

    remove()
    await api.get('/test')
    // Still 1 call because the interceptor has been removed
    expect(interceptor).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('addResponseInterceptor가 반환한 함수로 인터셉터를 제거한다', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 })))
    vi.stubGlobal('fetch', fetchMock)

    const interceptor = vi.fn((res: Response) => res)
    const remove = addResponseInterceptor(interceptor)

    await api.get('/test')
    expect(interceptor).toHaveBeenCalledTimes(1)

    remove()
    await api.get('/test')
    expect(interceptor).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('응답 인터셉터에서 응답을 변형할 수 있다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ original: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const remove = addResponseInterceptor(
      async () => new Response(JSON.stringify({ replaced: true }), { status: 200 }),
    )

    const result = await api.get('/test')
    expect(result.data).toEqual({ replaced: true })

    remove()
    vi.unstubAllGlobals()
  })

  it('ApiError는 다시 던져진다 (네트워크 에러로 감싸지 않음)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    try {
      await api.get('/protected')
      throw new Error('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(401)
      expect((err as ApiError).message).toContain('401')
    }
    vi.unstubAllGlobals()
  })

  it('fetch 자체 에러는 ApiError(0, ...)로 감싼다', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    try {
      await api.get('/down')
      throw new Error('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(0)
      expect((err as ApiError).message).toBeTruthy()
    }
  })

  it('비-Error rejection은 ApiError(0, "Network error")로 감싼다', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue('boom')

    try {
      await api.get('/down')
      throw new Error('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(0)
      expect((err as ApiError).message).toBe('Network error')
    }
  })

  it('204 No Content 응답은 data: null을 반환한다', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await api.delete('/users/1')
    expect(result.status).toBe(204)
    expect(result.data).toBeNull()
    vi.unstubAllGlobals()
  })

  it('content-length: 0 응답은 data: null을 반환한다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 200, headers: { 'content-length': '0' } }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await api.get('/empty')
    expect(result.status).toBe(200)
    expect(result.data).toBeNull()
    vi.unstubAllGlobals()
  })

  it('ApiError 인스턴스의 이름은 "ApiError" 이다', () => {
    const err = new ApiError(404, 'not found')
    expect(err.name).toBe('ApiError')
    expect(err.status).toBe(404)
    expect(err.message).toBe('not found')
  })

  it('getValidated는 스키마 검증이 성공하면 파싱된 데이터를 반환한다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: '123', count: 42 }), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const schema = z.object({ id: z.string(), count: z.number() })
    const result = await api.getValidated('/test-valid', schema)
    expect(result.data).toEqual({ id: '123', count: 42 })
    vi.unstubAllGlobals()
  })

  it('getValidated는 스키마 검증이 실패하면 ApiError를 던진다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 123, count: 'not-a-number' }), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const schema = z.object({ id: z.string(), count: z.number() })
    await expect(api.getValidated('/test-invalid', schema)).rejects.toThrow(ApiError)
    vi.unstubAllGlobals()
  })

  it('postValidated는 스키마 검증이 성공하면 파싱된 데이터를 반환한다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: '123', updated: true }), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const schema = z.object({ id: z.string(), updated: z.boolean() })
    const result = await api.postValidated('/test-post-valid', { name: 'hello' }, schema)
    expect(result.data).toEqual({ id: '123', updated: true })
    vi.unstubAllGlobals()
  })
})
