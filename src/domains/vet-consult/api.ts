import api from '@infrastructure/api'

import { vetMessageSchema, vetSchema, type Vet, type VetMessage } from './schema'

/**
 * Remote consult mode. The NestJS backend exposes the consult thread both as
 * a socket.io gateway (namespace /consult) and as REST. socket.io-client is
 * intentionally not a dependency of this app, so the live wiring uses the
 * REST endpoints + short-interval polling — honest "near-realtime", no new
 * packages. Falls back to the localStorage demo when VITE_API_URL is unset.
 */
export const isConsultRemote = Boolean(import.meta.env.VITE_API_URL)

/** Poll cadence for the open thread; background tabs pause via react-query. */
export const CONSULT_POLL_INTERVAL_MS = 3000

export async function listVets(): Promise<Vet[]> {
  const res = await api.get<Vet[]>('/consult/vets')
  return vetSchema.array().parse(res.data)
}

export async function listVetMessages(vetId: string): Promise<VetMessage[]> {
  const res = await api.get<VetMessage[]>(`/consult/vets/${encodeURIComponent(vetId)}/messages`)
  return vetMessageSchema.array().parse(res.data)
}

export async function sendVetMessage(vetId: string, body: string): Promise<VetMessage> {
  const res = await api.post<VetMessage>(`/consult/vets/${encodeURIComponent(vetId)}/messages`, {
    body,
  })
  return vetMessageSchema.parse(res.data)
}
