import { createHmac } from 'crypto'
import { getJwtSecret, looksLikeJwt, signJwt, verifyJwt } from './jwt'

const SECRET = 'test-secret-pettography'

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

describe('jwt helper', () => {
  it('signs and verifies a round-trip session token', () => {
    const iat = nowSeconds()
    const token = signJwt({ sub: 'acc-1', sid: 'sess-1', iat, exp: iat + 3600 }, SECRET)
    expect(looksLikeJwt(token)).toBe(true)

    const payload = verifyJwt(token, SECRET)
    expect(payload).toEqual({ sub: 'acc-1', sid: 'sess-1', iat, exp: iat + 3600, typ: 'session' })
  })

  it('emits a standard HS256 header', () => {
    const iat = nowSeconds()
    const token = signJwt({ sub: 'a', sid: 's', iat, exp: iat + 60 }, SECRET)
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8'))
    expect(header).toEqual({ alg: 'HS256', typ: 'JWT' })
  })

  it('returns null for a token signed with a different secret', () => {
    const iat = nowSeconds()
    const token = signJwt({ sub: 'a', sid: 's', iat, exp: iat + 60 }, SECRET)
    expect(verifyJwt(token, 'other-secret')).toBeNull()
  })

  it('returns null for a tampered payload', () => {
    const iat = nowSeconds()
    const token = signJwt({ sub: 'a', sid: 's', iat, exp: iat + 60 }, SECRET)
    const [header, , signature] = token.split('.')
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sub: 'admin', sid: 's', iat, exp: iat + 60, typ: 'session' })
    ).toString('base64url')
    expect(verifyJwt(`${header}.${tamperedPayload}.${signature}`, SECRET)).toBeNull()
  })

  it('returns null for an expired token', () => {
    const iat = nowSeconds() - 7200
    const token = signJwt({ sub: 'a', sid: 's', iat, exp: iat + 3600 }, SECRET)
    expect(verifyJwt(token, SECRET)).toBeNull()
  })

  it('returns null for structurally invalid tokens', () => {
    expect(verifyJwt('not-a-jwt', SECRET)).toBeNull()
    expect(verifyJwt('only.two', SECRET)).toBeNull()
    expect(verifyJwt('a.b.c.d', SECRET)).toBeNull()
    expect(looksLikeJwt('opaque-single-segment')).toBe(false)
  })

  it('rejects a non-session JWT that is otherwise validly signed', () => {
    // A token with a correct signature but missing the `typ: session` marker.
    const iat = nowSeconds()
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const payload = Buffer.from(
      JSON.stringify({ sub: 'a', sid: 's', iat, exp: iat + 60 })
    ).toString('base64url')
    const signingInput = `${header}.${payload}`
    const signature = createHmac('sha256', SECRET).update(signingInput).digest('base64url')
    expect(verifyJwt(`${signingInput}.${signature}`, SECRET)).toBeNull()
  })

  it('falls back to the dev secret when no override is configured', () => {
    expect(getJwtSecret({})).toBe('dev-only-change-me-pettography-jwt')
    expect(getJwtSecret({ PETTOGRAPHY_JWT_SECRET: '  ' })).toBe(
      'dev-only-change-me-pettography-jwt'
    )
    expect(getJwtSecret({ PETTOGRAPHY_JWT_SECRET: 'real-secret' })).toBe('real-secret')
  })
})
