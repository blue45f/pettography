import { describe, expect, it } from 'vitest'

import { createAppQueryClient } from './queryClient'

describe('createAppQueryClient', () => {
  it('centralizes default query and mutation policies', () => {
    const client = createAppQueryClient()
    const queryDefaults = client.getDefaultOptions().queries
    const mutationDefaults = client.getDefaultOptions().mutations

    expect(queryDefaults?.staleTime).toBe(60_000)
    expect(queryDefaults?.gcTime).toBe(5 * 60_000)
    expect(queryDefaults?.retry).toBe(1)
    expect(queryDefaults?.refetchOnWindowFocus).toBe(false)
    expect(mutationDefaults?.retry).toBe(0)
  })
})
