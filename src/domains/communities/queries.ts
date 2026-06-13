import { useQuery } from '@tanstack/react-query'

import { listCommunities, type ListCommunitiesParams } from './api'

export const communitiesKeys = {
  all: ['communities'] as const,
  list: (params: ListCommunitiesParams) => [...communitiesKeys.all, 'list', params] as const,
}

export function useCommunitiesList(params: ListCommunitiesParams = {}) {
  return useQuery({
    queryKey: communitiesKeys.list(params),
    queryFn: () => listCommunities(params),
    staleTime: 5 * 60 * 1000,
  })
}
