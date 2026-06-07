import api from '@services/api'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { AsyncStatus } from '@/types/index'

interface UseFetchOptions extends RequestInit {
  enabled?: boolean
}

interface UseFetchResult<T> {
  data: T | null
  status: AsyncStatus
  error: string | null
  refetch: () => Promise<void>
}

function useFetch<T>(url: string, options: UseFetchOptions = {}): UseFetchResult<T> {
  const { enabled = true, ...fetchOptions } = options

  // Serialize options to stabilize queryKey and prevent infinite rendering loops
  // when fetchOptions object literal is recreated on every render.
  const serializedOptions = useMemo(() => {
    try {
      const serializable = { ...fetchOptions } as Record<string, unknown>
      delete serializable.signal
      return JSON.stringify(serializable)
    } catch {
      return ''
    }
  }, [fetchOptions])

  const query = useQuery({
    queryKey: ['fetch', url, serializedOptions],
    enabled,
    queryFn: ({ signal }) => api.get<T>(url, { ...fetchOptions, signal }).then((res) => res.data),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  })

  const isLoading = query.fetchStatus === 'fetching' && query.isPending
  const status: AsyncStatus = query.isError
    ? 'error'
    : query.isSuccess
      ? 'success'
      : isLoading
        ? 'loading'
        : 'idle'

  const errorMessage =
    query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null

  return {
    data: query.data ?? null,
    status,
    error: errorMessage,
    refetch: async () => {
      await query.refetch({ cancelRefetch: true })
    },
  }
}

export default useFetch
