import { useQuery } from '@tanstack/react-query'

import { listFuneral, type ListFuneralParams } from './api'

export const funeralKeys = {
  all: ['funeral'] as const,
  list: (params: ListFuneralParams) => [...funeralKeys.all, 'list', params] as const,
}

export function useFuneralList(params: ListFuneralParams = {}) {
  return useQuery({
    queryKey: funeralKeys.list(params),
    queryFn: () => listFuneral(params),
    staleTime: 5 * 60 * 1000,
  })
}
