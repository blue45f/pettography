/** 로컬 기준 오늘 키(YYYY-MM-DD). 리포트 잠금해제·오늘의 팁 결정성에 사용해요. */
export function todayKey(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** 연중 일 수(1~366) — 날짜 기반 결정적 로테이션 인덱스. */
export function dayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000)
}

/** 날짜(+salt) 기반 결정적 선택 — 하루 동안 같은 항목을 골라요. */
export function pickDaily<T>(items: readonly T[], salt = 0): T | undefined {
  if (items.length === 0) return undefined
  return items[(dayOfYear() + salt) % items.length]
}
