import { useQuery } from '@tanstack/react-query'

import { getCareGuide } from './api'

export const careGuidesKeys = {
  all: ['care-guides'] as const,
  detail: (speciesId: string) => [...careGuidesKeys.all, 'detail', speciesId] as const,
}

export function useCareGuide(speciesId: string | undefined) {
  return useQuery({
    queryKey: careGuidesKeys.detail(speciesId ?? ''),
    queryFn: () => getCareGuide(speciesId ?? ''),
    enabled: Boolean(speciesId),
    staleTime: 5 * 60 * 1000,
  })
}
