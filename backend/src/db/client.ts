import { existsSync } from 'node:fs';

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

// 로컬 dev: .env에서 DATABASE_URL 로드(운영은 플랫폼 env 주입). 모듈 로드 시 1회.
if (!process.env.DATABASE_URL && existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch {
    // ignore — DATABASE_URL 없으면 기존 node:sqlite 백엔드로 폴백
  }
}

const url = process.env.DATABASE_URL;
// 풀 슬림화: Neon 무료 컴퓨트(autosuspend) 비용 가드.
export const pool = url
  ? new Pool({
      connectionString: url,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: true,
    })
  : null;

export const db = pool ? drizzle(pool, { schema }) : null;
export const dbEnabled = Boolean(pool);
