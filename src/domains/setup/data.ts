import type { SpeciesCategory } from '@domains/species'

export interface SetupPart {
  id: string
  label: string
  description: string
  basicKrw: number
  premiumKrw: number
  optional?: boolean
}

export const SETUP_GUIDES: Record<SpeciesCategory, SetupPart[]> = {
  reptile: [
    {
      id: 'enclosure',
      label: '사육장 (Terrarium)',
      description: '40~120cm 유리/PVC 사육장. 종 크기에 맞춰 선택.',
      basicKrw: 80000,
      premiumKrw: 300000,
    },
    {
      id: 'substrate',
      label: '바닥재',
      description: '키친타올·코코피트·렙티카펫 등. 종별 권장 다름.',
      basicKrw: 8000,
      premiumKrw: 30000,
    },
    {
      id: 'uvb',
      label: 'UVB 램프',
      description: '주행성 종 필수 (비어디드·거북). 6~12개월 교체.',
      basicKrw: 25000,
      premiumKrw: 70000,
    },
    {
      id: 'heat',
      label: '보온등·핫스팟',
      description: '온도 구배를 위한 발열등. 서모스탯과 함께.',
      basicKrw: 20000,
      premiumKrw: 60000,
    },
    {
      id: 'thermostat',
      label: '서모스탯',
      description: '온도 자동 제어. 화상·과열 방지 필수.',
      basicKrw: 25000,
      premiumKrw: 90000,
    },
    {
      id: 'hide',
      label: '은신처 2개',
      description: '핫존·쿨존 각각 1개. 코르크·반동굴 모형.',
      basicKrw: 10000,
      premiumKrw: 30000,
    },
    {
      id: 'meter',
      label: '디지털 온습도계 2개',
      description: '핫존·쿨존 양쪽 측정. 적외선 표면 온도계 추가 권장.',
      basicKrw: 8000,
      premiumKrw: 35000,
    },
    {
      id: 'food-first',
      label: '첫 달 사료·영양제',
      description: '귀뚜라미·밀웜·CGD·칼슘 더스팅 분말.',
      basicKrw: 15000,
      premiumKrw: 45000,
    },
  ],
  amphibian: [
    {
      id: 'enclosure',
      label: '수조/사육장',
      description: '아쿠아 또는 반습 사육장 (종에 따라).',
      basicKrw: 50000,
      premiumKrw: 180000,
    },
    {
      id: 'substrate',
      label: '바닥재·이끼',
      description: '코코피트, 스파그넘 모스 등.',
      basicKrw: 10000,
      premiumKrw: 30000,
    },
    {
      id: 'chiller',
      label: '쿨러/온도조절 (아홀로틀 등)',
      description: '저온 종 필수. 미니 쿨러 또는 팬.',
      basicKrw: 60000,
      premiumKrw: 250000,
      optional: true,
    },
    {
      id: 'filter',
      label: '여과기',
      description: '수서 종 필수. 외부·외걸이 필터.',
      basicKrw: 20000,
      premiumKrw: 80000,
    },
    {
      id: 'meter',
      label: '온도·pH 측정 키트',
      description: '수온계 + pH 시험지/측정기.',
      basicKrw: 10000,
      premiumKrw: 45000,
    },
    {
      id: 'food-first',
      label: '첫 달 먹이',
      description: '아홀로틀 펠릿·블러드웜·귀뚜라미.',
      basicKrw: 15000,
      premiumKrw: 40000,
    },
  ],
  bird: [
    {
      id: 'cage',
      label: '새장',
      description: '날개폭 2~3배 폭. 가로형 권장.',
      basicKrw: 70000,
      premiumKrw: 250000,
    },
    {
      id: 'perch',
      label: '횃대·놀이',
      description: '자연목 횃대 + 그네 + 사다리.',
      basicKrw: 15000,
      premiumKrw: 50000,
    },
    {
      id: 'food-first',
      label: '첫 달 사료',
      description: '시드믹스 + 펠릿 + 채소 (시금치·당근).',
      basicKrw: 18000,
      premiumKrw: 50000,
    },
    {
      id: 'meter',
      label: '실내 온습도계',
      description: '18~28℃, 50~60% 유지.',
      basicKrw: 8000,
      premiumKrw: 25000,
    },
    {
      id: 'cover',
      label: '커버·바닥지',
      description: '취침용 커버 + 케이지 바닥 신문지.',
      basicKrw: 10000,
      premiumKrw: 30000,
    },
  ],
  mammal: [
    {
      id: 'cage',
      label: '케이지',
      description: '슈가글라이더는 90×60×180cm 수직형 권장.',
      basicKrw: 80000,
      premiumKrw: 300000,
    },
    {
      id: 'wheel',
      label: '휠·은신처',
      description: '헷지호그·슈가글라이더는 휠 필수. 솔리드 휠 권장.',
      basicKrw: 25000,
      premiumKrw: 70000,
    },
    {
      id: 'heat',
      label: '보온등 (헷지호그)',
      description: '실내 22℃ 이하 시 보온등 필요. 동면 방지.',
      basicKrw: 18000,
      premiumKrw: 55000,
      optional: true,
    },
    {
      id: 'meter',
      label: '온습도계',
      description: '24~28℃ 유지 (헷지호그). 슈가글라이더는 18~28℃.',
      basicKrw: 8000,
      premiumKrw: 25000,
    },
    {
      id: 'food-first',
      label: '첫 달 사료',
      description: 'TPG/HPW 식단(슈가) 또는 고단백 캣사료(헷지).',
      basicKrw: 20000,
      premiumKrw: 60000,
    },
  ],
  arthropod: [
    {
      id: 'enclosure',
      label: '사육 케이스',
      description: '폴리카보네이트·아크릴 케이스 20~40cm.',
      basicKrw: 15000,
      premiumKrw: 60000,
    },
    {
      id: 'substrate',
      label: '바닥재',
      description: '코코피트·이끼. 종별 습도 요구 다름.',
      basicKrw: 8000,
      premiumKrw: 20000,
    },
    {
      id: 'hide',
      label: '은신처·장식',
      description: '코르크·식물 모형. 굴파기 본능 충족.',
      basicKrw: 5000,
      premiumKrw: 20000,
    },
    {
      id: 'meter',
      label: '온습도계',
      description: '24~28℃, 종별 60~80% 유지.',
      basicKrw: 8000,
      premiumKrw: 25000,
    },
    {
      id: 'food-first',
      label: '첫 달 먹이',
      description: '귀뚜라미·둠비아 로치.',
      basicKrw: 10000,
      premiumKrw: 30000,
    },
  ],
}

export const SETUP_SHOPS = [
  { id: 'thezoo', name: '더쥬 (The Zoo)', url: 'https://xn--9m1b023b.com/', tag: '파충류·게코·뱀' },
  {
    id: 'newrun',
    name: '뉴런쥬라기',
    url: 'https://newrunreptile.co.kr/',
    tag: '파충류·분양·용품',
  },
  {
    id: 'baltonj',
    name: '발토앤제이',
    url: 'https://baltonj.com/',
    tag: '대형 파충류 용품',
  },
  {
    id: 'mimine',
    name: '미미네아쿠아',
    url: 'https://mimineaqua.co.kr/',
    tag: '수족·UVB·양서류',
  },
  {
    id: 'bighorn',
    name: 'BIGHORN',
    url: 'https://bighorn.co.kr/',
    tag: '곤충·파충류·절지류',
  },
] as const

export function totalRange(
  parts: SetupPart[],
  includeOptional: boolean
): { basic: number; premium: number } {
  return parts.reduce(
    (acc, p) => {
      if (p.optional && !includeOptional) return acc
      return { basic: acc.basic + p.basicKrw, premium: acc.premium + p.premiumKrw }
    },
    { basic: 0, premium: 0 }
  )
}
