import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import useFetch from './useFetch'

const fetchMock = vi.fn()

function renderHookWithProvider<T>(hook: () => T) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  return renderHook(hook, { wrapper })
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function mockOk<T>(payload: T) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function mockFail(status = 500, statusText = 'Server Error') {
  return new Response(JSON.stringify({ status }), {
    status,
    statusText,
  })
}

describe('useFetch', () => {
  it('starts in idle when not enabled', () => {
    const { result } = renderHookWithProvider(() => useFetch('/x', { enabled: false }))
    expect(result.current.status).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('transitions to success and exposes data', async () => {
    fetchMock.mockResolvedValue(mockOk({ hello: 'world' }))
    const { result } = renderHookWithProvider(() => useFetch<{ hello: string }>('/api'))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.data).toEqual({ hello: 'world' })
    expect(result.current.error).toBeNull()
  })

  it('transitions to error on non-2xx', async () => {
    fetchMock.mockResolvedValue(mockFail(404, 'Not Found'))
    const { result } = renderHookWithProvider(() => useFetch('/api'))

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toContain('HTTP error! status: 404')
  })

  it('transitions to error on network error', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    const { result } = renderHookWithProvider(() => useFetch('/api'))

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('network down')
  })

  it('uses fallback error message for non-Error rejection', async () => {
    fetchMock.mockRejectedValue('nope')
    const { result } = renderHookWithProvider(() => useFetch('/api'))

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).toBe('Network error')
  })

  it('aborts the in-flight request on unmount and does not transition to error', async () => {
    let abortedSignal: AbortSignal | undefined
    fetchMock.mockImplementation((input: RequestInfo) => {
      abortedSignal = input instanceof Request ? input.signal : undefined
      return new Promise((_resolve, reject) => {
        abortedSignal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    })

    const { result, unmount } = renderHookWithProvider(() => useFetch('/api'))

    await waitFor(() => expect(result.current.status).toBe('loading'))
    expect(abortedSignal).toBeDefined()
    expect(abortedSignal!.aborted).toBe(false)

    unmount()

    expect(abortedSignal!.aborted).toBe(true)
    // Give the rejected promise a tick to settle; status must NOT become 'error'
    await new Promise((r) => setTimeout(r, 0))
    expect(result.current.status).not.toBe('error')
    expect(result.current.error).toBeNull()
  })

  it('refetch triggers a new fetch', async () => {
    fetchMock.mockResolvedValue(mockOk({ n: 1 }))
    const { result } = renderHookWithProvider(() => useFetch('/api'))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(fetchMock).toHaveBeenCalledTimes(1)

    fetchMock.mockResolvedValue(mockOk({ n: 2 }))
    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => expect(result.current.data).toEqual({ n: 2 }))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
