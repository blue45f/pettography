import api, { addRequestInterceptor, addResponseInterceptor } from '@services/api'
import { z } from 'zod'

import {
  auditLogSchema,
  authSessionSchema,
  forbiddenWordRuleSchema,
  publicAccountSchema,
  type AdminUpdateAccountInput,
  type AuditLog,
  type AuthSession,
  type ForbiddenWordInput,
  type ForbiddenWordRule,
  type LoginInput,
  type PublicAccount,
  type RegisterInput,
  type UpdateProfileInput,
  type WithdrawAccountInput,
} from './schema'
import { useAuthStore } from './store'

let interceptorsInstalled = false

export function installAuthInterceptors(): void {
  if (interceptorsInstalled) return
  interceptorsInstalled = true

  addRequestInterceptor((config) => {
    const token = useAuthStore.getState().token
    if (!token) return config
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    }
  })

  addResponseInterceptor((response) => {
    if (response.status === 401) {
      useAuthStore.getState().clearSession()
    }
    return response
  })
}

export async function register(input: RegisterInput): Promise<AuthSession> {
  const response = await api.postValidated('auth/register', input, authSessionSchema)
  useAuthStore.getState().setSession(response.data)
  return response.data
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const response = await api.postValidated('auth/login', input, authSessionSchema)
  useAuthStore.getState().setSession(response.data)
  return response.data
}

export async function logout(): Promise<void> {
  try {
    await api.post('auth/logout')
  } finally {
    useAuthStore.getState().clearSession()
  }
}

export async function fetchMe(): Promise<PublicAccount> {
  const response = await api.getValidated('auth/me', publicAccountSchema)
  useAuthStore.getState().setAccount(response.data)
  return response.data
}

export async function updateMe(input: UpdateProfileInput): Promise<PublicAccount> {
  const response = await api.patch<PublicAccount>('auth/me', input)
  const parsed = publicAccountSchema.parse(response.data)
  useAuthStore.getState().setAccount(parsed)
  return parsed
}

export async function withdrawMe(input: WithdrawAccountInput): Promise<PublicAccount> {
  const response = await api.delete<PublicAccount>('auth/me', {
    body: JSON.stringify(input),
  })
  const parsed = publicAccountSchema.parse(response.data)
  useAuthStore.getState().clearSession()
  return parsed
}

export async function listAccounts(): Promise<PublicAccount[]> {
  const response = await api.getValidated('auth/admin/accounts', z.array(publicAccountSchema))
  return response.data
}

export async function updateAccount(
  accountId: string,
  input: AdminUpdateAccountInput,
): Promise<PublicAccount> {
  const response = await api.patch<PublicAccount>(`auth/admin/accounts/${accountId}`, input)
  return publicAccountSchema.parse(response.data)
}

export async function removeAccount(accountId: string): Promise<void> {
  await api.delete(`auth/admin/accounts/${accountId}`)
}

export async function listAuditLogs(): Promise<AuditLog[]> {
  const response = await api.getValidated('auth/admin/audit-logs', z.array(auditLogSchema))
  return response.data
}

export async function listForbiddenWords(): Promise<ForbiddenWordRule[]> {
  const response = await api.getValidated(
    'moderation/admin/forbidden-words',
    z.array(forbiddenWordRuleSchema),
  )
  return response.data
}

export async function createForbiddenWord(input: ForbiddenWordInput): Promise<ForbiddenWordRule> {
  const response = await api.postValidated(
    'moderation/admin/forbidden-words',
    input,
    forbiddenWordRuleSchema,
  )
  return response.data
}

export async function updateForbiddenWord(
  id: string,
  input: Partial<ForbiddenWordInput>,
): Promise<ForbiddenWordRule> {
  const response = await api.patch<ForbiddenWordRule>(
    `moderation/admin/forbidden-words/${id}`,
    input,
  )
  return forbiddenWordRuleSchema.parse(response.data)
}

export async function removeForbiddenWord(id: string): Promise<void> {
  await api.delete(`moderation/admin/forbidden-words/${id}`)
}
