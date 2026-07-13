export interface PetEvent {
  id: string
  name: string
  startDate: string
  endDate: string
  venue: string
  region: '서울' | '고양' | '수원'
  kind: 'expo'
  url: string
  note: string
  sourceCheckedAt: string
}

/**
 * 공식 주최사 페이지에서 확인된 일정만 노출합니다.
 * 행사 일정은 수시로 바뀔 수 있으므로 화면에서도 공식 페이지 재확인을 안내합니다.
 */
export const PET_EVENTS_2026: readonly PetEvent[] = [
  {
    id: 'kpet-seoul-2026',
    name: '2026 케이펫페어 서울',
    startDate: '2026-07-17',
    endDate: '2026-07-19',
    venue: '코엑스',
    region: '서울',
    kind: 'expo',
    url: 'https://k-pet.co.kr/information/exhibition-scheduled-all/26pet_seoul/',
    note: '반려견 동반 규정과 입장 방법은 공식 관람 안내에서 확인하세요.',
    sourceCheckedAt: '2026-07-13',
  },
  {
    id: 'mypet-ilsan-part2-2026',
    name: '마이펫페어 2026 일산 Part 2',
    startDate: '2026-08-28',
    endDate: '2026-08-30',
    venue: '킨텍스 제2전시장 10홀',
    region: '고양',
    kind: 'expo',
    url: 'https://www.mypetfair.co.kr/overview',
    note: '공식 일정 페이지에서 행사 규모와 최신 관람 정보를 함께 확인하세요.',
    sourceCheckedAt: '2026-07-13',
  },
  {
    id: 'mypet-gwanggyo-2026',
    name: '마이펫페어 2026 광교',
    startDate: '2026-10-23',
    endDate: '2026-10-25',
    venue: '수원컨벤션센터 전홀',
    region: '수원',
    kind: 'expo',
    url: 'https://www.mypetfair.co.kr/overview',
    note: '교통·입장·동반 규정은 방문 직전에 공식 페이지에서 다시 확인하세요.',
    sourceCheckedAt: '2026-07-13',
  },
]

export function eventsByMonth(events: readonly PetEvent[]): Map<string, PetEvent[]> {
  const map = new Map<string, PetEvent[]>()
  for (const event of events) {
    const key = event.startDate.slice(0, 7)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(event)
  }
  return map
}

export function daysUntil(dateStr: string, now: Date = new Date()): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}
