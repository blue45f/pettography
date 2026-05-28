export interface PetEvent {
  id: string
  name: string
  startDate: string
  endDate: string
  venue: string
  region: '서울' | '부산' | '인천' | '수원' | '대전' | '대구' | '기타'
  kind: 'expo' | 'reptile' | 'community' | 'adoption'
  url: string
  note: string
}

export const PET_EVENTS_2026: readonly PetEvent[] = [
  {
    id: 'petnmore-seoul-q1',
    name: '2026 펫앤모어 서울 반려동물 박람회',
    startDate: '2026-02-27',
    endDate: '2026-03-01',
    venue: '코엑스 마곡 컨벤션센터',
    region: '서울',
    kind: 'expo',
    url: 'https://coexmagok.co.kr/exhibitions/2026-petmore-%EC%84%9C%EC%9A%B8-%EB%B0%98%EB%A0%A4%EB%8F%99%EB%AC%BC-%EB%B0%95%EB%9E%8C%ED%9A%8C/',
    note: 'PET&MORE 시리즈. 사료/용품/입양 부스 + 일부 파충류 분양.',
  },
  {
    id: 'petnmore-busan-q1',
    name: '2026 PET&MORE 부산 (봄)',
    startDate: '2026-03-13',
    endDate: '2026-03-15',
    venue: '벡스코',
    region: '부산',
    kind: 'expo',
    url: 'https://ilovepets.co.kr/board/?id=sub12_0',
    note: '부산권 사용자 우선. 입양 부스 + 의료 상담.',
  },
  {
    id: 'kpetfair-magok',
    name: '2026 케이펫페어 마곡',
    startDate: '2026-06-19',
    endDate: '2026-06-21',
    venue: '코엑스 마곡 컨벤션센터',
    region: '서울',
    kind: 'expo',
    url: 'https://k-pet.co.kr/information/exhibition-scheduled-all/26pet_magok/',
    note: '한국펫사료협회 주관. 사료·간식·용품 중심.',
  },
  {
    id: 'petnmore-busan-q3',
    name: '2026 PET&MORE 부산 (여름)',
    startDate: '2026-07-10',
    endDate: '2026-07-12',
    venue: '벡스코',
    region: '부산',
    kind: 'expo',
    url: 'https://ilovepets.co.kr/board/?id=sub12_0',
    note: '여름 시즌. 휴양·이동 케이지 위주.',
  },
  {
    id: 'mypetfair-songdo',
    name: '2026 마이펫페어 송도',
    startDate: '2026-08-21',
    endDate: '2026-08-23',
    venue: '송도 컨벤시아',
    region: '인천',
    kind: 'expo',
    url: 'https://www.showala.com/ex/ex_detail.php?idx=3216',
    note: '인천권 박람회. 예정 일정은 매년 변경 가능.',
  },
  {
    id: 'petnmore-suwon',
    name: '2026 PET&MORE 수원',
    startDate: '2026-12-18',
    endDate: '2026-12-20',
    venue: '수원 컨벤션센터',
    region: '수원',
    kind: 'expo',
    url: 'https://ilovepets.co.kr/board/?id=sub12_0',
    note: '연말 박람회.',
  },
  {
    id: 'reptilefair-2026',
    name: '렙타일페어 2026',
    startDate: '2026-09-12',
    endDate: '2026-09-13',
    venue: '서울 양재 aT센터 (예정)',
    region: '서울',
    kind: 'reptile',
    url: 'https://expo.am/en/exhibitions/1281/all/1',
    note: '국내 최대 파충류 전문 박람회. 일정 확정은 공식 사이트 확인.',
  },
  {
    id: 'megazoo-2026',
    name: '메가주 (Mega Zoo) 2026',
    startDate: '2026-10-10',
    endDate: '2026-10-12',
    venue: '서울 양재 aT센터 (예정)',
    region: '서울',
    kind: 'reptile',
    url: 'https://expo.am/en/exhibitions/1281/all/1',
    note: '파충류·이색 반려동물 박람회. 일정 확정은 공식 사이트.',
  },
]

export function eventsByMonth(events: readonly PetEvent[]): Map<string, PetEvent[]> {
  const map = new Map<string, PetEvent[]>()
  for (const e of events) {
    const key = e.startDate.slice(0, 7)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  return map
}

export function daysUntil(dateStr: string, now: Date = new Date()): number {
  const d = new Date(dateStr)
  return Math.round((d.getTime() - now.getTime()) / 86_400_000)
}
