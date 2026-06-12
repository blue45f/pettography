import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CHUNK_RETRY_STORAGE_KEY, retryImport } from './lazyRetry'

function settleProbe(promise: Promise<unknown>): Promise<'settled' | 'pending'> {
  return Promise.race([
    promise.then(
      () => 'settled' as const,
      () => 'settled' as const,
    ),
    new Promise<'pending'>((resolve) => {
      setTimeout(() => resolve('pending'), 25)
    }),
  ])
}

describe('retryImport', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the module and clears the retry flag on success', async () => {
    sessionStorage.setItem(CHUNK_RETRY_STORAGE_KEY, '1')
    const reload = vi.fn()

    await expect(retryImport(() => Promise.resolve({ default: 'page' }), reload)).resolves.toEqual({
      default: 'page',
    })

    expect(sessionStorage.getItem(CHUNK_RETRY_STORAGE_KEY)).toBeNull()
    expect(reload).not.toHaveBeenCalled()
  })

  it('reloads once on the first failure and keeps the promise pending', async () => {
    const reload = vi.fn()

    const failing = retryImport(() => Promise.reject(new Error('chunk load failed')), reload)

    await expect(settleProbe(failing)).resolves.toBe('pending')
    expect(reload).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem(CHUNK_RETRY_STORAGE_KEY)).toBe('1')
  })

  it('rethrows after a retry already happened so error boundaries render', async () => {
    sessionStorage.setItem(CHUNK_RETRY_STORAGE_KEY, '1')
    const reload = vi.fn()
    const error = new Error('still failing')

    await expect(retryImport(() => Promise.reject(error), reload)).rejects.toBe(error)
    expect(reload).not.toHaveBeenCalled()
  })

  it('rethrows instead of reloading when sessionStorage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })
    const reload = vi.fn()
    const error = new Error('chunk load failed')

    await expect(retryImport(() => Promise.reject(error), reload)).rejects.toBe(error)
    expect(reload).not.toHaveBeenCalled()
  })
})
