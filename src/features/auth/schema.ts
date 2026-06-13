import {
  accountRoleSchema,
  accountStatusSchema,
  forbiddenWordActionSchema,
  forbiddenWordMatchTypeSchema,
} from '@pettography/shared'
import { z } from 'zod'

export const publicAccountSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  role: accountRoleSchema,
  status: accountStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  lastLoginAt: z.string().nullable().optional(),
  withdrawnAt: z.string().nullable().optional(),
})

export const authSessionSchema = z.object({
  token: z.string().min(1),
  type: z.literal('Bearer'),
  account: publicAccountSchema,
})

export const forbiddenWordRuleSchema = z.object({
  id: z.string(),
  phrase: z.string().min(1),
  normalizedPhrase: z.string().min(1),
  action: forbiddenWordActionSchema,
  matchType: forbiddenWordMatchTypeSchema,
  enabled: z.boolean(),
  note: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const auditLogSchema = z.object({
  id: z.string(),
  actorId: z.string().nullable(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  createdAt: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type PublicAccount = z.infer<typeof publicAccountSchema>
export type AuthSession = z.infer<typeof authSessionSchema>
export type ForbiddenWordRule = z.infer<typeof forbiddenWordRuleSchema>
export type AuditLog = z.infer<typeof auditLogSchema>

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {
  name: string
}

export interface UpdateProfileInput {
  name?: string
  currentPassword?: string
  newPassword?: string
}

export interface WithdrawAccountInput {
  password: string
}

export interface AdminUpdateAccountInput {
  name?: string
  role?: PublicAccount['role']
  status?: PublicAccount['status']
}

export interface ForbiddenWordInput {
  phrase: string
  action: ForbiddenWordRule['action']
  matchType: ForbiddenWordRule['matchType']
  enabled?: boolean
  note?: string | null
}
