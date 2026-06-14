import assert from 'node:assert/strict'
import test from 'node:test'
import { validateBackendEnv, validateFrontendEnv } from './validate-env.mjs'

test('accepts empty optional environment with safe local defaults', () => {
  assert.deepEqual(validateFrontendEnv({}), {
    VITE_API_URL: undefined,
    VITE_KAKAO_MAP_KEY: undefined,
  })
  assert.deepEqual(validateBackendEnv({}), {
    PORT: 3001,
    CORS_ORIGINS: [],
    API_THROTTLE_TTL_MS: 60000,
    API_THROTTLE_LIMIT: 120,
  })
})

test('accepts public frontend URLs as either absolute URLs or same-origin paths', () => {
  assert.equal(
    validateFrontendEnv({ VITE_API_URL: 'https://api.example.com' }).VITE_API_URL,
    'https://api.example.com'
  )
  assert.equal(validateFrontendEnv({ VITE_API_URL: '/api' }).VITE_API_URL, '/api')
})

test('rejects invalid frontend API URLs', () => {
  assert.throws(() => validateFrontendEnv({ VITE_API_URL: 'api.example.com' }), /VITE_API_URL/)
})

test('rejects secret-looking variables exposed through the Vite public prefix', () => {
  assert.throws(() => validateFrontendEnv({ VITE_PUBLIC_TOKEN: 'leaked' }), /VITE_PUBLIC_TOKEN/)
})

test('normalizes backend numeric and CORS environment values', () => {
  assert.deepEqual(
    validateBackendEnv({
      PORT: '3002',
      CORS_ORIGINS: 'https://pettography.example, http://localhost:5173 ',
      API_THROTTLE_TTL_MS: '30000',
      API_THROTTLE_LIMIT: '50',
    }),
    {
      PORT: 3002,
      CORS_ORIGINS: ['https://pettography.example', 'http://localhost:5173'],
      API_THROTTLE_TTL_MS: 30000,
      API_THROTTLE_LIMIT: 50,
    }
  )
})

test('rejects invalid backend environment values', () => {
  assert.throws(
    () =>
      validateBackendEnv({
        PORT: '70000',
        CORS_ORIGINS: 'javascript:alert(1)',
        API_THROTTLE_TTL_MS: '-1',
        API_THROTTLE_LIMIT: '0',
      }),
    /PORT.*CORS_ORIGINS.*API_THROTTLE_TTL_MS.*API_THROTTLE_LIMIT/s
  )
})
