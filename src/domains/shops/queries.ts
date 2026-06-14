import { useQuery } from '@tanstack/react-query'

import { listShops, type ListShopsParams } from './api'

export const shopsKeys = {
  all: ['shops'] as const,
  list: (params: ListShopsParams) => [...shopsKeys.all, 'list', params] as const,
}

export function useShopsList(params: ListShopsParams = {}) {
  return useQuery({
    queryKey: shopsKeys.list(params),
    queryFn: () => listShops(params),
    staleTime: 60 * 1000,
  })
}
