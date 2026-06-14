import { z } from 'zod'

/**
 * 프론트엔드 환경변수 비차단(NON-FATAL) 검증.
 *
 * 앱 시작 시 `import.meta.env`의 VITE_* 값을 작은 Zod 스키마로 safeParse 한다.
 * 문제가 있어도 throw 하지 않고 `console.warn` 으로만 알린다 — 잘못된 값이
 * 런타임을 조용히 깨뜨리기 전에 콘솔에서 빨리 드러나게 하는 것이 목적이다.
 *
 * 빌드/CI 게이트 성격의 엄격 검증은 별도로 `scripts/validate-env.mjs`가 담당한다.
 */

function emptyToUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isSameOriginPath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//')
}

const frontendEnvSchema = z.object({
  // http(s) 절대 URL 또는 동일 출처 경로(/...). 미설정 시 '/api' 폴백.
  VITE_API_URL: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(1)
      .refine(
        (value) => isHttpUrl(value) || isSameOriginPath(value),
        'must be an http(s) URL or a same-origin path beginning with /'
      )
      .optional()
  ),
  // 공개 브라우저 키(시크릿 아님). 형식 강제는 하지 않는다.
  VITE_KAKAO_MAP_KEY: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
})

/**
 * 앱 부트스트랩 시 1회 호출. 절대 throw 하지 않는다.
 */
export function validateFrontendEnv(env: ImportMetaEnv = import.meta.env): void {
  const result = frontendEnvSchema.safeParse(env)

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ')
    console.warn(`[env] frontend environment validation warnings (non-fatal): ${issues}`)
  }
}
