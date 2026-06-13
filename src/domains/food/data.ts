import type { SpeciesCategory } from '@domains/species'

export interface FoodItem {
  id: string
  name: string
  unit: string
  approxUnitPriceKrw: number
  bestFor: SpeciesCategory[]
  nutrition: string
  caution: string
  shopUrl: string
}

export const FOOD_ITEMS: readonly FoodItem[] = [
  {
    id: 'cricket-twospot',
    name: '쌍별 귀뚜라미 (Gryllus bimaculatus)',
    unit: '10마리',
    approxUnitPriceKrw: 1500,
    bestFor: ['reptile', 'amphibian', 'arthropod'],
    nutrition: '단백질 60%·칼슘 비율 낮음. 칼슘 더스팅 필수.',
    caution: '점프력 강함 — 망사 케이스 필수. 사육장 탈출 위험.',
    shopUrl: 'https://m.seoulreptile.co.kr/goods/goods_view.php?goodsNo=1000001364',
  },
  {
    id: 'cricket-bulk',
    name: '갈색 귀뚜라미 (대용량)',
    unit: '50마리',
    approxUnitPriceKrw: 4000,
    bestFor: ['reptile', 'amphibian', 'arthropod'],
    nutrition: '단백질 풍부, 소화 잘 됨. 게코·도마뱀 주식.',
    caution: '신선도 유지 — 3~5일 안 소비 시 폐사. 큰 통에 보관.',
    shopUrl: 'https://bighorn.co.kr/product/먹이곤충-귀뚜라미-대용량/3745/',
  },
  {
    id: 'dubia',
    name: '둠비아 로치 (Dubia Roach)',
    unit: '20마리',
    approxUnitPriceKrw: 8000,
    bestFor: ['reptile', 'amphibian'],
    nutrition: '단백질 70%, 키틴질 낮음 — 소화 부담 적음. 비어디드 적합.',
    caution: '한국 사육은 합법이지만 야외 방생 절대 금지. 도망 안 가게 통 잘 닫기.',
    shopUrl: 'https://rodent.kr/',
  },
  {
    id: 'mealworm',
    name: '밀웜 (Mealworm)',
    unit: '50마리',
    approxUnitPriceKrw: 3500,
    bestFor: ['reptile', 'mammal'],
    nutrition: '단백질 50%·지방 30%. 간식용. 인:칼슘 비율 불균형.',
    caution: '주식으로 두면 비만·MBD 위험. 주 2~3회 간식으로.',
    shopUrl: 'https://xn--9m1b023b.com/product/생먹이-밀웜-50마리-단위/97/',
  },
  {
    id: 'superworm',
    name: '슈퍼웜 (Zophobas morio)',
    unit: '20마리',
    approxUnitPriceKrw: 5000,
    bestFor: ['reptile', 'amphibian'],
    nutrition: '단백질 50%, 큰 사이즈. 비어디드·중대형 도마뱀.',
    caution: '강한 턱 — 베이비에게 위험. 머리 으깨거나 큰 종에만.',
    shopUrl: 'https://rodent.kr/',
  },
  {
    id: 'pinky-mouse',
    name: '핑키 마우스 (Frozen Pinky)',
    unit: '10마리',
    approxUnitPriceKrw: 12000,
    bestFor: ['reptile'],
    nutrition: '단백질·지방 균형. 뱀·중대형 도마뱀 주식.',
    caution: '냉동 해동 후 미지근하게. 살아있는 핑키 급여는 뱀 부상 위험.',
    shopUrl: 'https://m.seoulreptile.co.kr/goods/goods_view.php?goodsNo=1000001406',
  },
  {
    id: 'cgd',
    name: 'CGD (Crested Gecko Diet)',
    unit: '60g 분말',
    approxUnitPriceKrw: 18000,
    bestFor: ['reptile'],
    nutrition: '과일·곤충·비타민 종합 분말. 크레스티드/가고일에 단독 급여 가능.',
    caution: '물 타서 푸딩 농도로 급여. 24시간 안 먹으면 교체.',
    shopUrl: 'https://geckoholic.co.kr/',
  },
  {
    id: 'bloodworm',
    name: '냉동 블러드웜',
    unit: '100g',
    approxUnitPriceKrw: 9000,
    bestFor: ['amphibian'],
    nutrition: '아홀로틀·개구리 등 수서 종. 단백질 50%.',
    caution: '해동 후 1~2회분 분리 보관. 재냉동 금지.',
    shopUrl: 'https://mimineaqua.co.kr/',
  },
  {
    id: 'axolotl-pellet',
    name: '아홀로틀 펠릿',
    unit: '50g',
    approxUnitPriceKrw: 12000,
    bestFor: ['amphibian'],
    nutrition: '아홀로틀 전용 가라앉는 펠릿. 단백질 45%.',
    caution: '먹다 남은 펠릿은 수질 오염. 5분 안에 회수.',
    shopUrl: 'https://mimineaqua.co.kr/',
  },
  {
    id: 'tpg-hpw',
    name: 'TPG / HPW 슈가글라이더 식단',
    unit: '500g 분말',
    approxUnitPriceKrw: 35000,
    bestFor: ['mammal'],
    nutrition: '슈가글라이더 영양 균형 식단. 과일·꿀·단백질 가루.',
    caution: '정확한 비율 필수. 자세는 공식 가이드 참조.',
    shopUrl: 'https://baltonj.com/',
  },
] as const

export function filterByCategory(category: SpeciesCategory | null): FoodItem[] {
  if (!category) return [...FOOD_ITEMS]
  return FOOD_ITEMS.filter((f) => f.bestFor.includes(category))
}
