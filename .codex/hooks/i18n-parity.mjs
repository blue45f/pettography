// PostToolUse hook — after an Edit/Write to an i18n locale JSON, verify that
// ko / en / ja keep identical key trees (the same check CI runs). Surfaces
// drift the moment it happens. Never blocks the tool flow (always exits 0).
import { execSync } from 'node:child_process'

let data = ''
process.stdin.on('data', (chunk) => (data += chunk))
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(data || '{}')
    const file = payload?.tool_input?.file_path || payload?.tool_input?.filePath || ''
    if (!/i18n\/locales\/.*\.json$/.test(file)) return
    try {
      execSync('pnpm exec vitest run src/i18n/locales.test.ts', { stdio: 'ignore' })
      console.log('[petto] i18n ko/en/ja key parity OK')
    } catch {
      console.log('[petto] i18n key parity FAILED — run /petto-i18n to list missing keys')
    }
  } catch {
    /* malformed input or runner issue: stay silent, never break the edit */
  }
})
