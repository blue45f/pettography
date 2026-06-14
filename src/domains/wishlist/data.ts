/**
 * Ordered readiness-checklist item ids. Each id resolves to an i18n label at
 * `wishlist.readiness.<id>`. Kept as a single shared list (not per-species) so
 * the persisted completion map stays stable across the catalog.
 *
 * - `space`      — 사육 공간 확보
 * - `budget`     — 초기/월 예산
 * - `experience` — 난이도에 맞는 경험
 * - `filing`     — 규제종 보관신고 확인
 * - `vet`        — 특수동물 병원 확보
 * - `time`       — 수명만큼의 장기 돌봄 각오
 * - `supplies`   — 필수 장비 준비
 */
export const READINESS_ITEMS: readonly string[] = [
  'space',
  'budget',
  'experience',
  'filing',
  'vet',
  'time',
  'supplies',
] as const
