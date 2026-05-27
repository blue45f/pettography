import { useQuery } from '@tanstack/react-query'

import { getSpecies, listSpecies, type ListSpeciesParams } from './api'

export const speciesKeys = {
  all: ['species'] as const,
  list: (params: ListSpeciesParams) => [...speciesKeys.all, 'list', params] as const,
  detail: (idOrSlug: string) => [...speciesKeys.all, 'detail', idOrSlug] as const,
}

export function useSpeciesList(params: ListSpeciesParams = {}) {
  return useQuery({
    queryKey: speciesKeys.list(params),
    queryFn: () => listSpecies(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSpecies(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: speciesKeys.detail(idOrSlug ?? ''),
    queryFn: () => getSpecies(idOrSlug ?? ''),
    enabled: Boolean(idOrSlug),
    staleTime: 5 * 60 * 1000,
  })
}
