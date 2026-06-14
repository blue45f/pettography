import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Dependency-free HS256 JWT helper.
 *
 * Session tokens are signed JSON Web Tokens (RFC 7519, HMAC-SHA256). The
 * implementation intentionally uses only Node's built-in `crypto` so the
 * backend keeps its crypto-native, zero-extra-dependency posture (scrypt is
 * still used for PASSWORD hashing — that is correct and unchanged).
 *
 * The emitted tokens are standard JWTs (`header.payload.signature`, base64url)
 * and verify against any conformant JWT library.
 */

/** Default HS256 secret used when no override is configured (dev/test only). */
const DEV_JWT_SECRET = 'dev-only-change-me-pettography-jwt'

/** Well-known secret name. Falls back to the dev default when unset. */
export function getJwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.PETTOGRAPHY_JWT_SECRET?.trim()
  return secret && secret.length > 0 ? secret : DEV_JWT_SECRET
}

export interface JwtPayload {
  /** Subject: the account id. */
  sub: string
  /** Session id, used for server-side revocation lookups. */
  sid: string
  /** Issued-at (seconds since epoch). */
  iat: number
  /** Expiry (seconds since epoch). */
  exp: number
  /** Token kind marker — guards against confusing other JWTs for sessions. */
  typ: 'session'
}

const HEADER = base64UrlEncode(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))

/** Sign a session payload into a compact HS256 JWT string. */
export function signJwt(payload: Omit<JwtPayload, 'typ'>, secret: string = getJwtSecret()): string {
  const fullPayload: JwtPayload = { ...payload, typ: 'session' }
  const encodedPayload = base64UrlEncode(Buffer.from(JSON.stringify(fullPayload)))
  const signingInput = `${HEADER}.${encodedPayload}`
  const signature = sign(signingInput, secret)
  return `${signingInput}.${signature}`
}

/**
 * Verify and decode a session JWT.
 *
 * Returns the decoded payload when the token is a structurally valid,
 * correctly-signed, non-expired session JWT; otherwise returns null. Never
 * throws — callers treat null as "not a (valid) JWT" and may fall back to the
 * legacy opaque-token path.
 */
export function verifyJwt(
  token: string,
  secret: string = getJwtSecret(),
  nowSeconds: number = Math.floor(Date.now() / 1000)
): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, payload, signature] = parts
  if (!header || !payload || !signature) return null

  const expected = sign(`${header}.${payload}`, secret)
  if (!constantTimeEquals(signature, expected)) return null

  let decoded: unknown
  try {
    decoded = JSON.parse(base64UrlDecode(payload).toString('utf8'))
  } catch {
    return null
  }
  if (!isJwtPayload(decoded)) return null
  if (decoded.typ !== 'session') return null
  if (decoded.exp <= nowSeconds) return null
  return decoded
}

/**
 * Cheap structural pre-check: does this string look like a JWT at all?
 * Used to decide whether to try the JWT path before the legacy opaque path.
 */
export function looksLikeJwt(token: string): boolean {
  return token.split('.').length === 3
}

function sign(input: string, secret: string): string {
  return base64UrlEncode(createHmac('sha256', secret).update(input).digest())
}

function isJwtPayload(value: unknown): value is JwtPayload {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.sub === 'string' &&
    typeof candidate.sid === 'string' &&
    typeof candidate.iat === 'number' &&
    typeof candidate.exp === 'number' &&
    candidate.typ === 'session'
  )
}

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64url')
}

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, 'base64url')
}
