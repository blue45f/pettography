import { mkdirSync } from 'fs';
import { DatabaseSync } from 'node:sqlite';
import { dirname, join } from 'path';

import { storeBackend } from '../db/store-backend';

const memoryStore = new Map<string, unknown>();
const databaseCache = new Map<string, DatabaseSync>();

export function resetStateStoresForTest(): void {
  memoryStore.clear();
}

export class JsonFileStore<T> {
  private readonly documentName: string;
  private readonly databasePath: string;
  private readonly useMemory: boolean;

  constructor(
    fileName: string,
    private readonly defaults: () => T,
  ) {
    const root = process.env.PETTOGRAPHY_DATA_DIR ?? join(process.cwd(), '.data');
    this.documentName = fileName.replace(/\.json$/i, '');
    this.databasePath = process.env.PETTOGRAPHY_DATABASE_PATH ?? join(root, 'pettography.sqlite');
    this.useMemory = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
  }

  load(): T {
    if (this.useMemory) {
      if (!memoryStore.has(this.documentName)) {
        memoryStore.set(this.documentName, this.defaults());
      }
      return clone(memoryStore.get(this.documentName) as T);
    }

    // Neon 백엔드(DATABASE_URL 설정 시): 하이드레이트된 캐시에서 동기 로드.
    if (storeBackend.enabled) {
      const fromDb = storeBackend.read<T>(this.documentName);
      if (fromDb === undefined) {
        const initial = this.defaults();
        this.save(initial);
        return clone(initial);
      }
      return clone(fromDb);
    }

    const row = this.database
      .prepare('SELECT data FROM app_state_documents WHERE name = ?')
      .get(this.documentName) as { data: string } | undefined;
    if (!row) {
      const initial = this.defaults();
      this.save(initial);
      return clone(initial);
    }
    return JSON.parse(row.data) as T;
  }

  save(value: T): void {
    const snapshot = clone(value);
    if (this.useMemory) {
      memoryStore.set(this.documentName, snapshot);
      return;
    }

    // Neon 백엔드: 캐시 갱신 + write-behind upsert(동기 계약 유지).
    if (storeBackend.enabled) {
      storeBackend.write(this.documentName, snapshot);
      return;
    }

    this.database
      .prepare(
        `INSERT INTO app_state_documents (name, data, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(name) DO UPDATE SET
           data = excluded.data,
           updated_at = excluded.updated_at`,
      )
      .run(this.documentName, JSON.stringify(snapshot), new Date().toISOString());
  }

  private get database(): DatabaseSync {
    let database = databaseCache.get(this.databasePath);
    if (database) return database;

    mkdirSync(dirname(this.databasePath), { recursive: true });
    database = new DatabaseSync(this.databasePath);
    database.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS app_state_documents (
        name TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    databaseCache.set(this.databasePath, database);
    return database;
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
