import { z } from 'zod'

/**
 * 백엔드 환경변수 비차단(NON-FATAL) 검증.
 *
 * 부팅을 절대 깨지 않는다 — safeParse 후 문제가 있으면 경고만 로깅한다.
 * 기존 `process.env` 직접 읽기(main.ts / common/* / auth / db)는 그대로 두고,
 * 이 모듈은 부트 시점에 한 번 "검증 + 경고"만 ADD 한다.
 *
 * 빌드/CI 게이트 성격의 엄격 검증은 별도로 `scripts/validate-env.mjs`가 담당한다.
 */

/** NODE_ENV==='production' 에서 사용되면 안 되는, 알려진 안전하지 않은 dev 기본값. */
const KNOWN_INSECURE_DEFAULTS = new Set([
  'dev-only-change-me-please',
  'dev-secret-change-me',
  'mypassword',
  'change-me-in-production',
  // 이 레포의 dev 전용 관리자 비밀번호 기본값(auth.service.ts).
  'admin-1234',
])

function emptyToUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value
}

function optionalString() {
  return z.preprocess(emptyToUndefined, z.string().trim().min(1).optional())
}

function optionalPositiveInt() {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? value : parsed
  }, z.number().int().positive().max(65535).optional())
}

function optionalCount() {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? value : parsed
  }, z.number().int().positive().optional())
}

/**
 * 모든 필드는 optional — 부팅 시 기본값 폴백이 존재하므로 부재는 정상이다.
 * 검증 목적은 "잘못된 형식"을 조기에 경고로 드러내는 것이다.
 */
const backendEnvSchema = z.object({
  NODE_ENV: optionalString(),
  PORT: optionalPositiveInt(),
  CORS_ORIGINS: optionalString(),
  API_THROTTLE_TTL_MS: optionalCount(),
  API_THROTTLE_LIMIT: optionalCount(),
  DATABASE_URL: optionalString(),
  PETTOGRAPHY_SESSION_TTL_MS: optionalCount(),
  PETTOGRAPHY_ADMIN_EMAIL: optionalString(),
  PETTOGRAPHY_ADMIN_PASSWORD: optionalString(),
  PETTOGRAPHY_ADMIN_NAME: optionalString(),
})

type Logger = { warn: (message: string) => void; error: (message: string) => void }

const consoleLogger: Logger = {
  warn: (message) => console.warn(message),
  error: (message) => console.error(message),
}

/**
 * 부트 시 1회 호출. 절대 throw/exit 하지 않는다.
 */
export function validateBackendEnv(
  env: NodeJS.ProcessEnv = process.env,
  logger: Logger = consoleLogger
): void {
  const result = backendEnvSchema.safeParse(env)

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ')
    logger.warn(`[env] backend environment validation warnings (non-fatal): ${issues}`)
  }

  if (env.NODE_ENV === 'production') {
    const adminPassword = env.PETTOGRAPHY_ADMIN_PASSWORD?.trim()
    if (!adminPassword) {
      logger.warn(
        '[env] WARNING: NODE_ENV=production but PETTOGRAPHY_ADMIN_PASSWORD is unset — falling back to the insecure dev default. Set a strong admin password.'
      )
    } else if (KNOWN_INSECURE_DEFAULTS.has(adminPassword)) {
      logger.error(
        '[env] SECURITY WARNING: NODE_ENV=production but PETTOGRAPHY_ADMIN_PASSWORD is a well-known insecure default. Rotate it to a strong, unique secret immediately.'
      )
    }

    if (!env.DATABASE_URL?.trim()) {
      logger.warn(
        '[env] WARNING: NODE_ENV=production but DATABASE_URL is unset — the server will fall back to the local file/in-memory store, which is not durable.'
      )
    }
  }
}
