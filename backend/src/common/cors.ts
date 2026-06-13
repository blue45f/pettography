/**
 * Resolves the CORS allowlist for both the HTTP app and the WebSocket gateway.
 *
 * Source of truth is the `CORS_ORIGINS` env var: a comma-separated list of
 * allowed origins (e.g. "https://pettography.vercel.app,https://www.example.com").
 * When unset, falls back to the Vite dev server so local development is
 * unchanged. This keeps deploys configurable without code edits.
 */
const DEFAULT_DEV_ORIGINS = ['http://localhost:5173'] as const

export function resolveCorsOrigins(raw: string | undefined = process.env.CORS_ORIGINS): string[] {
  if (!raw) {
    return [...DEFAULT_DEV_ORIGINS]
  }

  const origins = raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  return origins.length > 0 ? origins : [...DEFAULT_DEV_ORIGINS]
}
