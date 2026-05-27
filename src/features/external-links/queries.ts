import { useQuery } from '@tanstack/react-query'

import { listExternalLinks, type ListLinksParams } from './api'

export const externalLinksKeys = {
  all: ['external-links'] as const,
  list: (params: ListLinksParams) => [...externalLinksKeys.all, 'list', params] as const,
}

export function useExternalLinks(params: ListLinksParams = {}) {
  return useQuery({
    queryKey: externalLinksKeys.list(params),
    queryFn: () => listExternalLinks(params),
    staleTime: 5 * 60 * 1000,
  })
}
