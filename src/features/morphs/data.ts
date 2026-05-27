export interface Morph {
  id: string
  speciesSlug: string
  name: string
  description: string
  rarity: 'common' | 'mid' | 'rare'
  approxPriceMinKrw: number
  approxPriceMaxKrw: number
}

export const MORPHS: readonly Morph[] = [
  // Leopard gecko
  {
    id: 'leo-normal',
    speciesSlug: 'leopard-gecko',
    name: '노말 (Wild type)',
    description: '야생형 황금색·검은 점. 가장 흔하고 가격 부담 적음.',
    rarity: 'common',
    approxPriceMinKrw: 30000,
    approxPriceMaxKrw: 80000,
  },
  {
    id: 'leo-albino',
    speciesSlug: 'leopard-gecko',
    name: '알비노 (Tremper / Bell / Rainwater)',
    description: '멜라닌 결핍. 노랑·핑크 톤. 햇빛 민감.',
    rarity: 'mid',
    approxPriceMinKrw: 80000,
    approxPriceMaxKrw: 200000,
  },
  {
    id: 'leo-mack-snow',
    speciesSlug: 'leopard-gecko',
    name: '맥 스노우 (Mack Snow)',
    description: '베이비 시기 흑백, 성체 노랑 발현 약함.',
    rarity: 'mid',
    approxPriceMinKrw: 100000,
    approxPriceMaxKrw: 250000,
  },
  {
    id: 'leo-eclipse',
    speciesSlug: 'leopard-gecko',
    name: '이클립스 (Eclipse)',
    description: '눈 전체가 검은색. 강조 모프 콤보로 사용.',
    rarity: 'mid',
    approxPriceMinKrw: 120000,
    approxPriceMaxKrw: 300000,
  },
  {
    id: 'leo-blizzard',
    speciesSlug: 'leopard-gecko',
    name: '블리자드 (Blizzard)',
    description: '무패턴 단색. 베이비 흰색, 성체 노랑 미반사.',
    rarity: 'mid',
    approxPriceMinKrw: 100000,
    approxPriceMaxKrw: 220000,
  },
  {
    id: 'leo-black-night',
    speciesSlug: 'leopard-gecko',
    name: '블랙 나이트 (Black Night)',
    description: '거의 전신 흑색. 시그니처 고가 모프.',
    rarity: 'rare',
    approxPriceMinKrw: 800000,
    approxPriceMaxKrw: 1500000,
  },

  // Crested gecko
  {
    id: 'crested-normal',
    speciesSlug: 'crested-gecko',
    name: '미구분 노말',
    description: '브리딩 부산물·일반 컬러. 입문 추천.',
    rarity: 'common',
    approxPriceMinKrw: 30000,
    approxPriceMaxKrw: 80000,
  },
  {
    id: 'crested-harlequin',
    speciesSlug: 'crested-gecko',
    name: '할리퀸 (Harlequin)',
    description: '몸 측면까지 패턴이 흘러내림. 가장 흔한 패턴 모프.',
    rarity: 'mid',
    approxPriceMinKrw: 80000,
    approxPriceMaxKrw: 180000,
  },
  {
    id: 'crested-lilywhite',
    speciesSlug: 'crested-gecko',
    name: '릴리화이트 (Lily White)',
    description: '흰 패턴이 광범위. 헤테로/호모 차이 큼.',
    rarity: 'mid',
    approxPriceMinKrw: 100000,
    approxPriceMaxKrw: 350000,
  },
  {
    id: 'crested-axanthic',
    speciesSlug: 'crested-gecko',
    name: '아잔틱 (Axanthic)',
    description: '노란/빨간 색소 부재. 회·은빛.',
    rarity: 'rare',
    approxPriceMinKrw: 400000,
    approxPriceMaxKrw: 900000,
  },
  {
    id: 'crested-frappuccino',
    speciesSlug: 'crested-gecko',
    name: '프라푸치노 (Frappuccino)',
    description: '고채도 갈색 + 흰 패턴 콤보. 시그니처 모프.',
    rarity: 'rare',
    approxPriceMinKrw: 700000,
    approxPriceMaxKrw: 1500000,
  },

  // Ball python
  {
    id: 'ball-normal',
    speciesSlug: 'ball-python',
    name: '노말',
    description: '야생형 패턴. 가장 저렴.',
    rarity: 'common',
    approxPriceMinKrw: 80000,
    approxPriceMaxKrw: 200000,
  },
  {
    id: 'ball-pastel',
    speciesSlug: 'ball-python',
    name: '파스텔 (Pastel)',
    description: '노란빛 강조. 다른 모프와 콤보로 가치 상승.',
    rarity: 'common',
    approxPriceMinKrw: 100000,
    approxPriceMaxKrw: 250000,
  },
  {
    id: 'ball-piebald',
    speciesSlug: 'ball-python',
    name: '파이볼드 (Piebald)',
    description: '흰 패치 + 컬러 부위. 헤테로 페어 필요.',
    rarity: 'mid',
    approxPriceMinKrw: 400000,
    approxPriceMaxKrw: 900000,
  },
  {
    id: 'ball-banana',
    speciesSlug: 'ball-python',
    name: '바나나 (Banana)',
    description: '핑크-옐로우 톤. 수컷-수컷 비율 편향.',
    rarity: 'mid',
    approxPriceMinKrw: 250000,
    approxPriceMaxKrw: 600000,
  },

  // Bearded dragon
  {
    id: 'beardie-normal',
    speciesSlug: 'bearded-dragon',
    name: '노말',
    description: '야생형 갈색·황색.',
    rarity: 'common',
    approxPriceMinKrw: 80000,
    approxPriceMaxKrw: 200000,
  },
  {
    id: 'beardie-hypo',
    speciesSlug: 'bearded-dragon',
    name: '하이포 (Hypo)',
    description: '검은 색소 감소. 발톱 투명.',
    rarity: 'mid',
    approxPriceMinKrw: 150000,
    approxPriceMaxKrw: 400000,
  },
  {
    id: 'beardie-leatherback',
    speciesSlug: 'bearded-dragon',
    name: '레더백 (Leatherback)',
    description: '비늘 축소. 더 매끄러운 표면.',
    rarity: 'mid',
    approxPriceMinKrw: 200000,
    approxPriceMaxKrw: 500000,
  },
  {
    id: 'beardie-translucent',
    speciesSlug: 'bearded-dragon',
    name: '트랜스루센트 (Translucent)',
    description: '베이비 시기 반투명. 눈 색이 검정.',
    rarity: 'rare',
    approxPriceMinKrw: 350000,
    approxPriceMaxKrw: 900000,
  },

  // Corn snake
  {
    id: 'corn-normal',
    speciesSlug: 'corn-snake',
    name: '노말 (Carolina)',
    description: '야생형 주황 + 빨강 새들.',
    rarity: 'common',
    approxPriceMinKrw: 50000,
    approxPriceMaxKrw: 120000,
  },
  {
    id: 'corn-snow',
    speciesSlug: 'corn-snake',
    name: '스노우 (Snow)',
    description: '흰색 + 핑크 새들. 알비노 × 아네리스리스틱.',
    rarity: 'common',
    approxPriceMinKrw: 80000,
    approxPriceMaxKrw: 180000,
  },
  {
    id: 'corn-anery',
    speciesSlug: 'corn-snake',
    name: '아네리 (Anery)',
    description: '빨강 색소 부재. 회색·검정 톤.',
    rarity: 'common',
    approxPriceMinKrw: 70000,
    approxPriceMaxKrw: 150000,
  },
] as const

export const MORPH_BREEDERS = [
  {
    id: 'thebreeders',
    name: 'The Breeders',
    url: 'https://thebreeders.cafe24.com/',
    tag: '브리더 다이렉트',
  },
  {
    id: 'newrun',
    name: '뉴런쥬라기',
    url: 'https://newrunreptile.co.kr/',
    tag: '레오·크레 분양',
  },
  {
    id: 'geckoholic',
    name: '게코홀릭',
    url: 'https://geckoholic.co.kr/',
    tag: '크레스티드 게코 전문',
  },
  {
    id: 'crepax',
    name: '크레팍스',
    url: 'https://crepax.kr/',
    tag: '크레스티드 게코 브리더',
  },
  {
    id: 'themonster',
    name: '더몬스터',
    url: 'https://themonster.co.kr/',
    tag: '동탄 파충류샵',
  },
] as const
