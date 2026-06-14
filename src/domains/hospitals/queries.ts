import { useQuery } from '@tanstack/react-query'

import { getHospital, listHospitals, type ListHospitalsParams } from './api'

export const hospitalsKeys = {
  all: ['hospitals'] as const,
  list: (params: ListHospitalsParams) => [...hospitalsKeys.all, 'list', params] as const,
  detail: (id: string) => [...hospitalsKeys.all, 'detail', id] as const,
}

export function useHospitalsList(params: ListHospitalsParams = {}) {
  return useQuery({
    queryKey: hospitalsKeys.list(params),
    queryFn: () => listHospitals(params),
    staleTime: 60 * 1000,
  })
}

export function useHospital(id: string | undefined) {
  return useQuery({
    queryKey: hospitalsKeys.detail(id ?? ''),
    queryFn: () => getHospital(id ?? ''),
    enabled: Boolean(id),
  })
}
