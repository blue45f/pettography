import { db, dbEnabled } from './client';
import { documents } from './schema';

/**
 * JsonFileStore의 Neon 백엔드.
 * - 시작 시 `hydrate()`로 모든 document를 메모리 캐시로 적재(NestFactory.create 이전 1회).
 * - `read()`는 동기로 캐시를 반환해 기존 `JsonFileStore.load()`의 동기 계약을 유지한다.
 * - `write()`는 캐시 갱신 + 비동기 upsert(write-behind)로 Neon에 반영한다(실패는 로그).
 * DATABASE_URL 미설정 시 비활성 → JsonFileStore는 기존 node:sqlite 백엔드로 동작한다.
 */
class StoreBackend {
  private cache = new Map<string, unknown>();
  private hydrated = false;

  get enabled(): boolean {
    return dbEnabled;
  }

  async hydrate(): Promise<void> {
    if (!dbEnabled || !db || this.hydrated) return;
    const rows = await db.select().from(documents);
    for (const row of rows) {
      this.cache.set(row.name, row.data);
    }
    this.hydrated = true;
  }

  read<T>(name: string): T | undefined {
    return this.cache.get(name) as T | undefined;
  }

  write(name: string, value: unknown): void {
    if (!dbEnabled || !db) return;
    this.cache.set(name, value);
    void db
      .insert(documents)
      .values({ name, data: value })
      .onConflictDoUpdate({
        target: documents.name,
        set: { data: value, updatedAt: new Date() },
      })
      .catch((error: unknown) => {
        console.error(`[store-backend] upsert failed for ${name}:`, error);
      });
  }
}

export const storeBackend = new StoreBackend();
