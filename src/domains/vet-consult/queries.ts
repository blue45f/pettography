import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  CONSULT_POLL_INTERVAL_MS,
  isConsultRemote,
  listVetMessages,
  listVets,
  sendVetMessage,
} from './api'

import type { VetMessage } from './schema'

export const consultKeys = {
  all: ['consult'] as const,
  vets: () => [...consultKeys.all, 'vets'] as const,
  thread: (vetId: string) => [...consultKeys.all, 'thread', vetId] as const,
}

export function useConsultVets() {
  return useQuery({
    queryKey: consultKeys.vets(),
    queryFn: listVets,
    enabled: isConsultRemote,
    staleTime: 60 * 1000,
  })
}

/** Polls the open thread while the tab is visible (remote mode only). */
export function useConsultThread(vetId: string | null) {
  return useQuery({
    queryKey: consultKeys.thread(vetId ?? ''),
    queryFn: () => listVetMessages(vetId ?? ''),
    enabled: isConsultRemote && Boolean(vetId),
    refetchInterval: CONSULT_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  })
}

export function useSendVetMessage(vetId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => {
      if (!vetId) return Promise.reject(new Error('no vet selected'))
      return sendVetMessage(vetId, body)
    },
    onSuccess: (message) => {
      if (!vetId) return
      // Append optimistically so the bubble shows before the next poll tick;
      // the poll then reconciles (and picks up the vet's auto reply).
      queryClient.setQueryData<VetMessage[]>(consultKeys.thread(vetId), (prev) => {
        const list = prev ?? []
        if (list.some((m) => m.id === message.id)) return list
        return [...list, message]
      })
      void queryClient.invalidateQueries({ queryKey: consultKeys.thread(vetId) })
    },
  })
}
