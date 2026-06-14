import { ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { scryptSync } from 'crypto'
import { resetStateStoresForTest } from '../common/json-store'
import { AuthService } from './auth.service'
import { getJwtSecret, signJwt, verifyJwt } from './jwt'

interface SessionRow {
  id: string
  accountId: string
  tokenHash: string | null
  createdAt: string
  expiresAt: string
  revokedAt?: string | null
}

interface AuthStateShape {
  sessions: SessionRow[]
}

function legacyTokenHash(token: string): string {
  return scryptSync(token, 'pettography-session-token', 32).toString('hex')
}

function privateState(service: AuthService): AuthStateShape {
  return (service as unknown as { state: AuthStateShape }).state
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(() => {
    resetStateStoresForTest()
    service = new AuthService()
    service.onModuleInit()
  })

  it('registers, logs in, and authenticates active accounts', () => {
    const session = service.register({
      email: 'member@example.com',
      name: 'Member',
      password: 'password-1234',
    })

    expect(session.token).toBeTruthy()
    expect(session.account.email).toBe('member@example.com')
    expect(session.account.role).toBe('member')

    const login = service.login({
      email: 'member@example.com',
      password: 'password-1234',
    })
    expect(service.authenticateToken(login.token)?.id).toBe(session.account.id)
  })

  it('issues a signed session JWT (not an opaque token) bound to the account', () => {
    const session = service.register({
      email: 'jwt@example.com',
      name: 'Jwt User',
      password: 'password-1234',
    })

    // A compact JWS: header.payload.signature
    expect(session.token.split('.')).toHaveLength(3)
    const payload = verifyJwt(session.token, getJwtSecret())
    expect(payload).not.toBeNull()
    expect(payload?.sub).toBe(session.account.id)
    expect(payload?.typ).toBe('session')
    // The session row is keyed by the JWT `sid` and stores no token material.
    const row = privateState(service).sessions.find((s) => s.id === payload?.sid)
    expect(row).toBeDefined()
    expect(row?.tokenHash).toBeNull()
  })

  it('rejects a JWT whose signature was forged with the wrong secret', () => {
    const session = service.register({
      email: 'forge@example.com',
      name: 'Forge',
      password: 'password-1234',
    })
    const payload = verifyJwt(session.token, getJwtSecret())
    const forged = signJwt(
      { sub: payload!.sub, sid: payload!.sid, iat: payload!.iat, exp: payload!.exp },
      'attacker-secret'
    )
    expect(service.authenticateToken(forged)).toBeNull()
  })

  it('logs out a JWT session and revokes it server-side', () => {
    const session = service.register({
      email: 'logout@example.com',
      name: 'Logout',
      password: 'password-1234',
    })
    expect(service.authenticateToken(session.token)).not.toBeNull()
    service.logout(session.token)
    expect(service.authenticateToken(session.token)).toBeNull()
  })

  it('gracefully accepts pre-existing opaque tokens until they are replaced by JWT', () => {
    const session = service.register({
      email: 'legacy@example.com',
      name: 'Legacy',
      password: 'password-1234',
    })
    // Simulate a session created under the OLD opaque-token scheme.
    const opaqueToken = 'legacy-opaque-token-value-abc123'
    const state = privateState(service)
    const expiresAt = new Date(Date.now() + 60_000).toISOString()
    state.sessions.push({
      id: 'legacy-session-1',
      accountId: session.account.id,
      tokenHash: legacyTokenHash(opaqueToken),
      createdAt: new Date().toISOString(),
      expiresAt,
      revokedAt: null,
    })

    // Old token still authenticates -> no lockout for already-logged-in users.
    expect(service.authenticateToken(opaqueToken)?.id).toBe(session.account.id)
    // And logout still revokes the legacy session.
    service.logout(opaqueToken)
    expect(service.authenticateToken(opaqueToken)).toBeNull()
  })

  it('withdraws accounts, revokes sessions, anonymizes identity, and frees email', () => {
    const session = service.register({
      email: 'leave@example.com',
      name: 'Leave Me',
      password: 'password-1234',
    })

    const withdrawn = service.withdraw(session.account.id, { password: 'password-1234' })
    expect(withdrawn.status).toBe('withdrawn')
    expect(withdrawn.email).toContain('@withdrawn.pettography.local')
    expect(service.authenticateToken(session.token)).toBeNull()
    expect(() => service.login({ email: 'leave@example.com', password: 'password-1234' })).toThrow(
      UnauthorizedException
    )

    const next = service.register({
      email: 'leave@example.com',
      name: 'New Owner',
      password: 'password-5678',
    })
    expect(next.account.email).toBe('leave@example.com')
  })

  it('prevents removing or demoting the last active admin', () => {
    const adminLogin = service.login({
      email: 'admin@pettography.local',
      password: 'admin-1234',
    })

    expect(() =>
      service.updateAccount(adminLogin.account.id, adminLogin.account.id, { role: 'member' })
    ).toThrow(ForbiddenException)
    expect(() => service.removeAccount(adminLogin.account.id, adminLogin.account.id)).toThrow(
      ForbiddenException
    )
  })
})
