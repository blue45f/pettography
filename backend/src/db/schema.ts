import { pgTable, text, jsonb, timestamp } from 'drizzle-orm/pg-core'

// JsonFileStore(현재 node:sqlite의 app_state_documents)를 Neon Postgres로 옮기기 위한
// 제네릭 document 테이블 — 문서 1개당 행 1개로 상태 JSON을 JSONB로 보관한다.
export const documents = pgTable('app_state_documents', {
  name: text('name').primaryKey(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
})
