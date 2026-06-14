import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  type OnModuleInit,
} from '@nestjs/common'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto'
import { JsonFileStore } from '../common/json-store'
import { getJwtSecret, looksLikeJwt, signJwt, verifyJwt } from './jwt'
import type {
  Account,
  AccountRole,
  AccountSession,
  AccountStatus,
  AuditLog,
  PublicAccount,
} from '../common/types'
import type { AdminUpdateAccountDto } from './dto/admin-account.dto'
import type { LoginDto, RegisterDto, UpdateProfileDto, WithdrawAccountDto } from './dto/auth.dto'

interface AuthState {
  users: Account[]
  sessions: AccountSession[]
  auditLogs: AuditLog[]
}

const SESSION_TTL_MS = Number(process.env.PETTOGRAPHY_SESSION_TTL_MS ?? 1000 * 60 * 60 * 24 * 14)
const DEV_ADMIN_EMAIL = 'admin@pettography.local'
const DEV_ADMIN_PASSWORD = 'admin-1234'

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly store = new JsonFileStore<AuthState>('auth.json', () => ({
    users: [],
    sessions: [],
    auditLogs: [],
  }))
  private state = this.store.load()

  onModuleInit(): void {
    this.seedInitialAdmin()
  }

  register(input: RegisterDto) {
    const email = normalizeEmail(input.email)
    if (this.findUserByEmail(email, { includeWithdrawn: false })) {
      throw new ConflictException('Email is already registered.')
    }
    const now = new Date().toISOString()
    const account: Account = {
      id: randomUUID(),
      email,
      name: input.name.trim(),
      passwordHash: hashPassword(input.password),
      role: 'member',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      withdrawnAt: null,
    }
    this.state.users.push(account)
    this.audit(null, 'auth.registered', 'account', account.id, { email })
    this.save()
    return this.issueSession(account)
  }

  login(input: LoginDto) {
    const user = this.findUserByEmail(input.email, { includeWithdrawn: false })
    if (!user || !user.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password.')
    }
    if (user.status === 'suspended') {
      throw new ForbiddenException('This account is suspended.')
    }
    if (user.status === 'withdrawn') {
      throw new UnauthorizedException('Invalid email or password.')
    }
    user.lastLoginAt = new Date().toISOString()
    user.updatedAt = user.lastLoginAt
    this.audit(user.id, 'auth.login', 'account', user.id)
    this.save()
    return this.issueSession(user)
  }

  logout(token: string): void {
    const session = this.resolveSession(token)
    if (session && !session.revokedAt) {
      session.revokedAt = new Date().toISOString()
      this.audit(session.accountId, 'auth.logout', 'session', session.id)
      this.save()
    }
  }

  authenticateToken(token: string): PublicAccount | null {
    const session = this.resolveSession(token)
    const now = Date.now()
    if (!session || session.revokedAt || new Date(session.expiresAt).getTime() <= now) {
      return null
    }
    const account = this.state.users.find((candidate) => candidate.id === session.accountId)
    if (!account || account.status !== 'active') {
      return null
    }
    return toPublicAccount(account)
  }

  /**
   * Resolve a bearer token to its backing session row, supporting both schemes:
   *
   * 1. Signed JWT (current): verify the HS256 signature + expiry, then look the
   *    session up by its `sid` claim. The server-side row is still consulted so
   *    revocation (logout, password change, suspend, withdraw) keeps working.
   * 2. Legacy opaque token: scrypt-hash the token and match it against the
   *    stored `tokenHash`. This keeps already-issued opaque sessions valid so
   *    existing users are NOT locked out — re-login simply upgrades them to JWT.
   */
  private resolveSession(token: string): AccountSession | undefined {
    if (looksLikeJwt(token)) {
      const payload = verifyJwt(token, getJwtSecret())
      if (payload) {
        return this.state.sessions.find((candidate) => candidate.id === payload.sid)
      }
      // A dotted token that fails JWT verification is not a legacy opaque token
      // (those are single base64url segments), so do not fall through.
      return undefined
    }
    const tokenHash = hashToken(token)
    return this.state.sessions.find((candidate) => candidate.tokenHash === tokenHash)
  }

  getProfile(accountId: string): PublicAccount {
    return toPublicAccount(this.requireActiveAccount(accountId))
  }

  updateProfile(accountId: string, input: UpdateProfileDto): PublicAccount {
    const account = this.requireActiveAccount(accountId)
    if (input.name !== undefined) {
      account.name = input.name.trim()
    }
    if (input.newPassword !== undefined) {
      if (!input.currentPassword || !account.passwordHash) {
        throw new UnauthorizedException('Current password is required.')
      }
      if (!verifyPassword(input.currentPassword, account.passwordHash)) {
        throw new UnauthorizedException('Current password is invalid.')
      }
      account.passwordHash = hashPassword(input.newPassword)
      this.revokeSessions(account.id)
    }
    account.updatedAt = new Date().toISOString()
    this.audit(account.id, 'auth.profile_updated', 'account', account.id)
    this.save()
    return toPublicAccount(account)
  }

  withdraw(accountId: string, input: WithdrawAccountDto): PublicAccount {
    const account = this.requireActiveAccount(accountId)
    if (!account.passwordHash || !verifyPassword(input.password, account.passwordHash)) {
      throw new UnauthorizedException('Password is invalid.')
    }
    if (account.role === 'admin' && this.countActiveAdmins() <= 1) {
      throw new ForbiddenException('The last active admin account cannot be withdrawn.')
    }
    this.markWithdrawn(account)
    this.audit(account.id, 'auth.account_withdrawn', 'account', account.id)
    this.save()
    return toPublicAccount(account)
  }

  listAccounts(): PublicAccount[] {
    return [...this.state.users]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((account) => toPublicAccount(account))
  }

  updateAccount(actorId: string, accountId: string, input: AdminUpdateAccountDto): PublicAccount {
    const target = this.state.users.find((account) => account.id === accountId)
    if (!target) {
      throw new NotFoundException(`Account not found: ${accountId}`)
    }
    const nextRole = input.role ?? target.role
    const nextStatus = input.status ?? target.status
    this.assertAdminInvariant(target, { nextRole, nextStatus, actorId })

    if (input.name !== undefined) {
      target.name = input.name.trim()
    }
    if (input.role !== undefined) {
      target.role = input.role
    }
    if (input.status !== undefined) {
      if (input.status === 'withdrawn') {
        this.markWithdrawn(target)
      } else {
        target.status = input.status
        target.withdrawnAt = null
        if (input.status !== 'active') {
          this.revokeSessions(target.id)
        }
      }
    }
    target.updatedAt = new Date().toISOString()
    this.audit(actorId, 'admin.account_updated', 'account', target.id, {
      role: target.role,
      status: target.status,
    })
    this.save()
    return toPublicAccount(target)
  }

  removeAccount(actorId: string, accountId: string): void {
    const target = this.state.users.find((account) => account.id === accountId)
    if (!target) {
      throw new NotFoundException(`Account not found: ${accountId}`)
    }
    this.assertAdminInvariant(target, {
      nextRole: target.role,
      nextStatus: 'withdrawn',
      actorId,
    })
    this.markWithdrawn(target)
    this.audit(actorId, 'admin.account_removed', 'account', target.id)
    this.save()
  }

  getAuditLogs(): AuditLog[] {
    return [...this.state.auditLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  private seedInitialAdmin(): void {
    if (this.state.users.some((user) => user.role === 'admin' && user.status === 'active')) {
      return
    }
    const email = normalizeEmail(process.env.PETTOGRAPHY_ADMIN_EMAIL ?? DEV_ADMIN_EMAIL)
    const password = process.env.PETTOGRAPHY_ADMIN_PASSWORD ?? DEV_ADMIN_PASSWORD
    const now = new Date().toISOString()
    this.state.users.push({
      id: randomUUID(),
      email,
      name: process.env.PETTOGRAPHY_ADMIN_NAME ?? 'Pettography Admin',
      passwordHash: hashPassword(password),
      role: 'admin',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      withdrawnAt: null,
    })
    this.audit(null, 'auth.admin_seeded', 'account', email)
    this.save()
  }

  private findUserByEmail(
    email: string,
    options: { includeWithdrawn: boolean }
  ): Account | undefined {
    const normalized = normalizeEmail(email)
    return this.state.users.find(
      (account) =>
        account.email === normalized && (options.includeWithdrawn || account.status !== 'withdrawn')
    )
  }

  private requireActiveAccount(accountId: string): Account {
    const account = this.state.users.find((candidate) => candidate.id === accountId)
    if (!account || account.status !== 'active') {
      throw new UnauthorizedException('Account is not active.')
    }
    return account
  }

  private issueSession(account: Account) {
    const sessionId = randomUUID()
    const now = Date.now()
    const expiresAt = now + SESSION_TTL_MS
    // Signed HS256 JWT. The session row is still persisted (looked up by `sid`)
    // so server-side revocation continues to work; no token material is stored.
    const token = signJwt({
      sub: account.id,
      sid: sessionId,
      iat: Math.floor(now / 1000),
      exp: Math.floor(expiresAt / 1000),
    })
    this.state.sessions.push({
      id: sessionId,
      accountId: account.id,
      tokenHash: null,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      revokedAt: null,
    })
    this.save()
    return {
      token,
      type: 'Bearer',
      account: toPublicAccount(account),
    }
  }

  private assertAdminInvariant(
    target: Account,
    input: { nextRole: AccountRole; nextStatus: AccountStatus; actorId: string }
  ): void {
    const removesAdmin =
      target.role === 'admin' &&
      (input.nextRole !== 'admin' ||
        input.nextStatus === 'withdrawn' ||
        input.nextStatus === 'suspended')
    if (removesAdmin && this.countActiveAdmins() <= 1) {
      throw new ForbiddenException('The last active admin account cannot be removed or demoted.')
    }
    if (target.id === input.actorId && input.nextStatus !== 'active') {
      throw new ForbiddenException('Admins cannot deactivate their own account.')
    }
  }

  private countActiveAdmins(): number {
    return this.state.users.filter((user) => user.role === 'admin' && user.status === 'active')
      .length
  }

  private markWithdrawn(account: Account): void {
    const now = new Date().toISOString()
    account.status = 'withdrawn'
    account.withdrawnAt = now
    account.email = `withdrawn-${account.id}@withdrawn.pettography.local`
    account.name = 'Withdrawn account'
    account.passwordHash = null
    account.updatedAt = now
    this.revokeSessions(account.id)
  }

  private revokeSessions(accountId: string): void {
    const now = new Date().toISOString()
    for (const session of this.state.sessions) {
      if (session.accountId === accountId && !session.revokedAt) {
        session.revokedAt = now
      }
    }
  }

  private audit(
    actorId: string | null,
    action: string,
    targetType: string,
    targetId: string,
    metadata?: Record<string, unknown>
  ): void {
    this.state.auditLogs.push({
      id: randomUUID(),
      actorId,
      action,
      targetType,
      targetId,
      createdAt: new Date().toISOString(),
      ...(metadata ? { metadata } : {}),
    })
  }

  private save(): void {
    this.store.save(this.state)
  }
}

export function toPublicAccount(account: Account): PublicAccount {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role,
    status: account.status,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    lastLoginAt: account.lastLoginAt,
    withdrawnAt: account.withdrawnAt,
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [algorithm, salt, encoded] = stored.split(':')
  if (algorithm !== 'scrypt' || !salt || !encoded) return false
  const expected = Buffer.from(encoded, 'hex')
  const actual = scryptSync(password, salt, expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function hashToken(token: string): string {
  return scryptSync(token, 'pettography-session-token', 32).toString('hex')
}
