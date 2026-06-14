import { useQuery } from '@tanstack/react-query'

import { listAdoption, type ListAdoptionParams } from './api'

export const adoptionKeys = {
  all: ['adoption'] as const,
  list: (params: ListAdoptionParams) => [...adoptionKeys.all, 'list', params] as const,
}

export function useAdoptionList(params: ListAdoptionParams = {}) {
  return useQuery({
    queryKey: adoptionKeys.list(params),
    queryFn: () => listAdoption(params),
    staleTime: 5 * 60 * 1000,
  })
}
