/**
 * Local development seed for the Postgres-backed `app_state_documents` store.
 *
 * The frontend-facing catalog data (species/hospitals/shops/care-guides/forum/…)
 * is compiled in from `src/data/*.seed.ts` and served straight from memory, so
 * it does NOT live in the database. The only *stateful* documents persisted to
 * Postgres go through `JsonFileStore` — today that is:
 *
 *   - `auth`       → accounts, sessions, audit logs (AuthService)
 *   - `moderation` → forbidden-word rules (ModerationService)
 *
 * This script upserts a RICH, realistic set of those documents so a freshly
 * provisioned local DB has loginable accounts across every role/status plus a
 * working moderation rule set, instead of just the single auto-seeded admin.
 *
 * SAFETY: run ONLY against a local DB by passing DATABASE_URL inline, e.g.
 *   DATABASE_URL=postgresql://qa:qa@localhost:5433/pettography pnpm run db:seed
 * The script refuses to run against a *.neon.tech host as a guard rail.
 *
 * Idempotent: account IDs / rule IDs are derived deterministically from their
 * natural key (email / phrase), and audit logs / sessions are rebuilt from
 * scratch each run, so re-running converges to the same state without dupes.
 */
import { randomBytes, scryptSync, createHash } from 'node:crypto'

import { Pool } from 'pg'

import type {
  Account,
  AccountRole,
  AccountSession,
  AccountStatus,
  AuditLog,
  ForbiddenWordRule,
} from '../common/types'
import type { ForbiddenWordAction, ForbiddenWordMatchType } from '@pettography/shared'

interface AuthState {
  users: Account[]
  sessions: AccountSession[]
  auditLogs: AuditLog[]
}

interface ModerationState {
  forbiddenWords: ForbiddenWordRule[]
}

// scrypt password hashing — kept byte-for-byte compatible with AuthService so
// seeded accounts authenticate through the real login path.
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

// Deterministic UUID-shaped id from a stable natural key, so re-seeding is
// idempotent (same email → same account id).
function stableId(prefix: string, key: string): string {
  const digest = createHash('sha256').update(`${prefix}:${key}`).digest('hex')
  return [
    digest.slice(0, 8),
    digest.slice(8, 12),
    `4${digest.slice(13, 16)}`,
    `8${digest.slice(17, 20)}`,
    digest.slice(20, 32),
  ].join('-')
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizeText(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

const DEFAULT_PASSWORD = 'pettography-1234'

interface SeedAccount {
  email: string
  name: string
  role: AccountRole
  status: AccountStatus
  createdDaysAgo: number
  lastLoginDaysAgo?: number | null
}

// 12 active members + 1 moderator + 1 admin + 1 suspended + 1 withdrawn = breadth
// across every role and status combination the admin console can render.
const SEED_ACCOUNTS: SeedAccount[] = [
  {
    email: 'admin@pettography.local',
    name: 'Pettography Admin',
    role: 'admin',
    status: 'active',
    createdDaysAgo: 120,
    lastLoginDaysAgo: 0,
  },
  {
    email: 'mod@pettography.local',
    name: '운영지기 한별',
    role: 'moderator',
    status: 'active',
    createdDaysAgo: 96,
    lastLoginDaysAgo: 1,
  },
  {
    email: 'gecko.lover@example.com',
    name: '김도윤',
    role: 'member',
    status: 'active',
    createdDaysAgo: 80,
    lastLoginDaysAgo: 0,
  },
  {
    email: 'tarantula.keeper@example.com',
    name: '이서연',
    role: 'member',
    status: 'active',
    createdDaysAgo: 74,
    lastLoginDaysAgo: 2,
  },
  {
    email: 'parrot.dad@example.com',
    name: '박지호',
    role: 'member',
    status: 'active',
    createdDaysAgo: 70,
    lastLoginDaysAgo: 3,
  },
  {
    email: 'frogwhisperer@example.com',
    name: '최예린',
    role: 'member',
    status: 'active',
    createdDaysAgo: 61,
    lastLoginDaysAgo: 5,
  },
  {
    email: 'hedgehog.home@example.com',
    name: '정민준',
    role: 'member',
    status: 'active',
    createdDaysAgo: 55,
    lastLoginDaysAgo: 1,
  },
  {
    email: 'snake.songpa@example.com',
    name: '강하은',
    role: 'member',
    status: 'active',
    createdDaysAgo: 48,
    lastLoginDaysAgo: 8,
  },
  {
    email: 'mantis.lab@example.com',
    name: '윤서준',
    role: 'member',
    status: 'active',
    createdDaysAgo: 40,
    lastLoginDaysAgo: 4,
  },
  {
    email: 'sugarglider.kr@example.com',
    name: '임수아',
    role: 'member',
    status: 'active',
    createdDaysAgo: 33,
    lastLoginDaysAgo: 6,
  },
  {
    email: 'axolotl.tank@example.com',
    name: '오지안',
    role: 'member',
    status: 'active',
    createdDaysAgo: 27,
    lastLoginDaysAgo: 2,
  },
  {
    email: 'cockatiel.song@example.com',
    name: '한유나',
    role: 'member',
    status: 'active',
    createdDaysAgo: 19,
    lastLoginDaysAgo: 1,
  },
  {
    email: 'newbie.reptile@example.com',
    name: '서지우',
    role: 'member',
    status: 'active',
    createdDaysAgo: 9,
    lastLoginDaysAgo: 0,
  },
  {
    email: 'spammer.suspended@example.com',
    name: '정지된 계정',
    role: 'member',
    status: 'suspended',
    createdDaysAgo: 44,
    lastLoginDaysAgo: 20,
  },
  {
    email: 'left.us@example.com',
    name: '탈퇴 예정 회원',
    role: 'member',
    status: 'withdrawn',
    createdDaysAgo: 65,
    lastLoginDaysAgo: 30,
  },
]

interface SeedRule {
  phrase: string
  action: ForbiddenWordAction
  matchType: ForbiddenWordMatchType
  enabled: boolean
  note: string
}

const SEED_FORBIDDEN_WORDS: SeedRule[] = [
  {
    phrase: '불법포획',
    action: 'block',
    matchType: 'contains',
    enabled: true,
    note: '야생동물 불법 포획·거래 유도 차단',
  },
  {
    phrase: '밀수',
    action: 'block',
    matchType: 'contains',
    enabled: true,
    note: 'CITES 위반 밀수 거래 차단',
  },
  {
    phrase: '판매합니다',
    action: 'review',
    matchType: 'contains',
    enabled: true,
    note: '개인 분양/판매 글은 검토 대기로 전환',
  },
  {
    phrase: '직거래',
    action: 'review',
    matchType: 'whole_word',
    enabled: true,
    note: '비공식 직거래 권유 모니터링',
  },
  {
    phrase: '도배',
    action: 'review',
    matchType: 'whole_word',
    enabled: false,
    note: '도배성 게시 감지(현재 비활성 — 오탐 검토 중)',
  },
]

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is required. Pass it inline, e.g.\n' +
        '  DATABASE_URL=postgresql://qa:qa@localhost:5433/pettography pnpm run db:seed'
    )
  }
  if (/\.neon\.tech/i.test(url)) {
    throw new Error(
      'Refusing to seed: DATABASE_URL points at a *.neon.tech host (production). ' +
        'Use a LOCAL database URL.'
    )
  }

  const pool = new Pool({ connectionString: url, max: 3 })
  try {
    const now = new Date().toISOString()

    // ── auth document ─────────────────────────────────────────────────────
    const users: Account[] = SEED_ACCOUNTS.map((seed) => {
      const email = normalizeEmail(seed.email)
      const createdAt = daysAgo(seed.createdDaysAgo)
      const withdrawn = seed.status === 'withdrawn'
      return {
        id: stableId('account', email),
        email: withdrawn
          ? `withdrawn-${stableId('account', email)}@withdrawn.pettography.local`
          : email,
        name: withdrawn ? 'Withdrawn account' : seed.name,
        passwordHash: withdrawn ? null : hashPassword(DEFAULT_PASSWORD),
        role: seed.role,
        status: seed.status,
        createdAt,
        updatedAt: now,
        lastLoginAt:
          seed.lastLoginDaysAgo === undefined || seed.lastLoginDaysAgo === null
            ? null
            : daysAgo(seed.lastLoginDaysAgo),
        withdrawnAt: withdrawn ? daysAgo(3) : null,
      }
    })

    const auditLogs: AuditLog[] = [
      {
        id: stableId('audit', 'admin-seeded'),
        actorId: null,
        action: 'auth.admin_seeded',
        targetType: 'account',
        targetId: 'admin@pettography.local',
        createdAt: daysAgo(120),
      },
      {
        id: stableId('audit', 'mod-promoted'),
        actorId: users[0].id,
        action: 'admin.account_updated',
        targetType: 'account',
        targetId: users[1].id,
        createdAt: daysAgo(95),
        metadata: { role: 'moderator', status: 'active' },
      },
      {
        id: stableId('audit', 'spammer-suspended'),
        actorId: users[1].id,
        action: 'admin.account_updated',
        targetType: 'account',
        targetId: users.find((u) => u.status === 'suspended')?.id ?? 'unknown',
        createdAt: daysAgo(18),
        metadata: { role: 'member', status: 'suspended' },
      },
    ]

    const authState: AuthState = { users, sessions: [], auditLogs }

    // ── moderation document ───────────────────────────────────────────────
    const forbiddenWords: ForbiddenWordRule[] = SEED_FORBIDDEN_WORDS.map((rule, index) => {
      const createdAt = daysAgo(90 - index * 7)
      return {
        id: stableId('forbidden', rule.phrase),
        phrase: rule.phrase,
        normalizedPhrase: normalizeText(rule.phrase),
        action: rule.action,
        matchType: rule.matchType,
        enabled: rule.enabled,
        note: rule.note,
        createdAt,
        updatedAt: createdAt,
      }
    })
    const moderationState: ModerationState = { forbiddenWords }

    // ── upsert both documents ─────────────────────────────────────────────
    const upsert = `
      INSERT INTO app_state_documents (name, data, updated_at)
      VALUES ($1, $2, now())
      ON CONFLICT (name) DO UPDATE
        SET data = EXCLUDED.data, updated_at = now()
    `
    await pool.query(upsert, ['auth', JSON.stringify(authState)])
    await pool.query(upsert, ['moderation', JSON.stringify(moderationState)])

    const counts = {
      accounts: users.length,
      activeMembers: users.filter((u) => u.role === 'member' && u.status === 'active').length,
      moderators: users.filter((u) => u.role === 'moderator').length,
      admins: users.filter((u) => u.role === 'admin').length,
      suspended: users.filter((u) => u.status === 'suspended').length,
      withdrawn: users.filter((u) => u.status === 'withdrawn').length,
      auditLogs: auditLogs.length,
      forbiddenWords: forbiddenWords.length,
    }

    console.log('[db:seed] Seeded app_state_documents (auth, moderation).')
    console.table(counts)
    console.log('[db:seed] Loginable test accounts (password for all: ' + DEFAULT_PASSWORD + '):')
    console.log('  admin     → admin@pettography.local')
    console.log('  moderator → mod@pettography.local')
    console.log('  member    → gecko.lover@example.com (and 10 more @example.com members)')
  } finally {
    await pool.end()
  }
}

main().catch((error: unknown) => {
  console.error('[db:seed] failed:', error)
  process.exit(1)
})
