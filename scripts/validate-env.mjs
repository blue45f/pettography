#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const PUBLIC_SECRET_NAME_PATTERN = /(SECRET|TOKEN|PASSWORD|PRIVATE|CREDENTIAL)/i

function emptyStringToUndefined(value) {
  return typeof value === 'string' && value.trim() === '' ? undefined : value
}

function optionalTrimmedString() {
  return z.preprocess(emptyStringToUndefined, z.string().trim().min(1).optional())
}

function parseOptionalPositiveInt(fallback) {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return fallback
    return Number(value)
  }, z.number().int().positive())
}

function formatZodIssues(error) {
  return error.issues
    .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('; ')
}

function parseOrThrow(schema, value, label) {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new Error(`${label} validation failed: ${formatZodIssues(result.error)}`)
  }
  return result.data
}

function isHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isSameOriginPath(value) {
  return value.startsWith('/') && !value.startsWith('//')
}

function parseCorsOrigins(value) {
  if (value === undefined || value === null || value === '') return []
  if (typeof value !== 'string') return value
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

const frontendEnvSchema = z.object({
  VITE_API_URL: optionalTrimmedString().refine(
    (value) => value === undefined || isHttpUrl(value) || isSameOriginPath(value),
    'must be an http(s) URL or a same-origin path beginning with /'
  ),
  VITE_KAKAO_MAP_KEY: optionalTrimmedString(),
})

const backendEnvSchema = z.object({
  PORT: parseOptionalPositiveInt(3001).refine((port) => port <= 65535, 'must be <= 65535'),
  CORS_ORIGINS: z.preprocess(
    parseCorsOrigins,
    z.array(z.string().refine(isHttpUrl, 'must be an http(s) URL')).default([])
  ),
  API_THROTTLE_TTL_MS: parseOptionalPositiveInt(60000),
  API_THROTTLE_LIMIT: parseOptionalPositiveInt(120),
})

export function validateFrontendEnv(env = process.env) {
  const publicSecretNames = Object.keys(env)
    .filter((name) => name.startsWith('VITE_') && PUBLIC_SECRET_NAME_PATTERN.test(name))
    .filter((name) => String(env[name] ?? '').trim() !== '')

  if (publicSecretNames.length > 0) {
    throw new Error(
      `frontend env validation failed: public Vite env cannot expose secret-looking names: ${publicSecretNames.join(
        ', '
      )}`
    )
  }

  const parsed = parseOrThrow(frontendEnvSchema, env, 'frontend env')
  return {
    VITE_API_URL: parsed.VITE_API_URL,
    VITE_KAKAO_MAP_KEY: parsed.VITE_KAKAO_MAP_KEY,
  }
}

export function validateBackendEnv(env = process.env) {
  return parseOrThrow(backendEnvSchema, env, 'backend env')
}

export function validateEnv(env = process.env) {
  return {
    frontend: validateFrontendEnv(env),
    backend: validateBackendEnv(env),
  }
}

function runCli() {
  try {
    validateEnv(process.env)
    console.log('environment validation passed: frontend and backend env contracts are valid')
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli()
}
