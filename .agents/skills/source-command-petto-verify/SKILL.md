---
name: 'source-command-petto-verify'
description: 'Run the pettography quality gate (pnpm run verify) and report pass/fail concisely'
---

# source-command-petto-verify

Use this skill when the user asks to run the migrated source command `petto-verify`.

## Command Template

Run `pnpm run verify` — the project's full quality gate as defined in `package.json` (architecture validation + the CI suite). Report a concise pass/fail summary; stop at the first failure and surface only that step's output.

If everything passes, remind that `pnpm run verify:push` (adds security lint) is the pre-push gate, and `pnpm run verify:all` additionally runs the backend gate. For i18n parity-only debugging, use `/petto-i18n`.

Do not commit or push. Just verify and report.
