import type { CleanupCrew, Plant, SpeciesCategory, SpeciesTemplate, SubstrateLayer } from './schema'

/**
 * Substrate layers, listed roughly bottom → top. A balanced humid bioactive
 * build stacks drainage → barrier → substrate → topper; arid setups skip the
 * drainage layer and use a leaner bare/sand mix.
 */
export const SUBSTRATE_LAYERS: readonly SubstrateLayer[] = [
  {
    id: 'sub-hydroball',
    name: '하이드로볼 배수층',
    role: 'drainage',
    suitsCategories: ['reptile', 'amphibian', 'arthropod'],
    note: '바닥에 고인 물을 모아 뿌리 썩음을 막는 배수층. 다습 사육장의 기본.',
  },
  {
    id: 'sub-mesh',
    name: '메쉬 분리망',
    role: 'barrier',
    suitsCategories: ['reptile', 'amphibian', 'arthropod', 'mammal'],
    note: '배수층과 흙이 섞이지 않게 막아 주는 분리망. 배수층 위에 한 장.',
  },
  {
    id: 'sub-organic',
    name: '유기물 믹스 (코코피트+유기토+모래)',
    role: 'substrate',
    suitsCategories: ['reptile', 'amphibian', 'arthropod', 'mammal'],
    note: '클린업 크루와 식물 뿌리가 자리잡는 핵심 토양층. 5~10cm 권장.',
  },
  {
    id: 'sub-leaf-litter',
    name: '낙엽 리터',
    role: 'topper',
    suitsCategories: ['reptile', 'amphibian', 'arthropod'],
    note: '등각류·톡토기의 은신처이자 먹이. 자가정화의 엔진.',
  },
  {
    id: 'sub-sphagnum',
    name: '물이끼 토퍼',
    role: 'topper',
    suitsCategories: ['amphibian', 'reptile', 'arthropod'],
    note: '국소 습도를 끌어올리는 표면층. 산란·탈피 지점에 유용.',
  },
  {
    id: 'sub-arid-mix',
    name: '건조 모래·흙 믹스 (배수층 생략)',
    role: 'substrate',
    suitsCategories: ['reptile', 'arthropod'],
    note: '사막종용 저습 바닥재. 배수층 없이 잘 마르게 구성.',
  },
] as const

/**
 * The cleanup crew — detritivores that break down waste, mould and shed skin
 * so the enclosure self-cleans. Match the crew's moisture band to the build.
 */
export const CLEANUP_CREW: readonly CleanupCrew[] = [
  {
    id: 'crew-dairy-cow',
    name: '데어리 카우 등각류',
    kind: 'isopod',
    humidity: 'mid',
    note: '튼튼하고 번식이 빨라 입문용으로 최적인 등각류.',
  },
  {
    id: 'crew-powder-orange',
    name: '파우더 오렌지 등각류',
    kind: 'isopod',
    humidity: 'humid',
    note: '습한 환경을 좋아하는 소형 등각류. 다습 빌드에 잘 맞음.',
  },
  {
    id: 'crew-dwarf-white',
    name: '드워프 화이트 등각류',
    kind: 'isopod',
    humidity: 'humid',
    note: '아주 작고 습기를 좋아함. 개구리·소형종 사육장에 적합.',
  },
  {
    id: 'crew-springtail',
    name: '톡토기 (스프링테일)',
    kind: 'springtail',
    humidity: 'humid',
    note: '곰팡이를 먹어 치우는 미세 청소부. 거의 모든 다습 빌드의 필수 멤버.',
  },
  {
    id: 'crew-giant-canyon',
    name: '자이언트 캐년 등각류',
    kind: 'isopod',
    humidity: 'arid',
    note: '건조 환경에 강한 대형 등각류. 사막종 빌드에서도 견딤.',
  },
  {
    id: 'crew-mealworm-beetle',
    name: '버팔로 비틀 (사체 청소)',
    kind: 'other',
    humidity: 'mid',
    note: '남은 먹이·사체를 빠르게 처리하는 보조 청소부.',
  },
] as const

/**
 * Live plants stabilise humidity, cycle nutrients and give the enclosure a
 * natural look. Pick by light and moisture so they actually survive.
 */
export const PLANTS: readonly Plant[] = [
  {
    id: 'plant-pothos',
    name: '포토스',
    light: 'low',
    humidity: 'mid',
    note: '거의 죽지 않는 입문용 덩굴식물. 질산염 흡수에 탁월.',
  },
  {
    id: 'plant-bromeliad',
    name: '브로멜리아드',
    light: 'med',
    humidity: 'humid',
    note: '잎 컵에 물을 머금는 착생식물. 수직·다습 사육장의 포인트.',
  },
  {
    id: 'plant-sansevieria',
    name: '산세베리아',
    light: 'low',
    humidity: 'arid',
    note: '건조에 매우 강함. 사막종 빌드에 어울리는 다육성 식물.',
  },
  {
    id: 'plant-moss',
    name: '이끼 (생이끼)',
    light: 'low',
    humidity: 'humid',
    note: '바닥 습도를 높게 유지. 다습 환경에서만 살아남음.',
  },
  {
    id: 'plant-staghorn',
    name: '박쥐란',
    light: 'med',
    humidity: 'humid',
    note: '벽면 착생으로 공간을 살리는 양치식물. 분무를 좋아함.',
  },
  {
    id: 'plant-succulent',
    name: '다육식물',
    light: 'high',
    humidity: 'arid',
    note: '강한 빛과 건조를 좋아함. 사막 비바리움 연출에 적합.',
  },
] as const

/**
 * Per-species starting points. `recommended*Ids` reference the catalog above.
 * A generic fallback per category covers everything else.
 */
export const SPECIES_TEMPLATES: Readonly<Record<string, SpeciesTemplate>> = {
  'leopard-gecko': {
    tempHotC: 32,
    tempCoolC: 24,
    humidityPct: 40,
    recommendedSubstrateIds: ['sub-arid-mix', 'sub-leaf-litter'],
    recommendedCrewIds: ['crew-giant-canyon', 'crew-dairy-cow'],
    recommendedPlantIds: ['plant-sansevieria', 'plant-succulent'],
    tip: '저습 사막종. 배수층 없이 건조 믹스로 가고, 습은신처 한 곳만 따로 마련하세요.',
  },
  'crested-gecko': {
    tempHotC: 26,
    tempCoolC: 22,
    humidityPct: 70,
    recommendedSubstrateIds: ['sub-hydroball', 'sub-mesh', 'sub-organic', 'sub-leaf-litter'],
    recommendedCrewIds: ['crew-springtail', 'crew-powder-orange'],
    recommendedPlantIds: ['plant-pothos', 'plant-bromeliad', 'plant-staghorn'],
    tip: '수직형 다습 빌드. 키 큰 식물로 등반 동선을 만들고 야간에 분무로 습도를 올리세요.',
  },
  'ball-python': {
    tempHotC: 31,
    tempCoolC: 24,
    humidityPct: 55,
    recommendedSubstrateIds: ['sub-hydroball', 'sub-mesh', 'sub-organic', 'sub-leaf-litter'],
    recommendedCrewIds: ['crew-dairy-cow', 'crew-springtail'],
    recommendedPlantIds: ['plant-pothos', 'plant-sansevieria'],
    tip: '중간 습도종. 굵은 개체 무게를 견디게 토양을 단단히 다지고 은신처를 양쪽에 두세요.',
  },
  'bearded-dragon': {
    tempHotC: 40,
    tempCoolC: 26,
    humidityPct: 35,
    recommendedSubstrateIds: ['sub-arid-mix'],
    recommendedCrewIds: ['crew-giant-canyon'],
    recommendedPlantIds: ['plant-succulent', 'plant-sansevieria'],
    tip: '강한 바스킹과 UVB가 핵심인 사막종. 바닥은 바짝 마르게, 식물은 건조 내성종만.',
  },
  'pacman-frog': {
    tempHotC: 28,
    tempCoolC: 24,
    humidityPct: 80,
    recommendedSubstrateIds: ['sub-hydroball', 'sub-mesh', 'sub-organic', 'sub-sphagnum'],
    recommendedCrewIds: ['crew-springtail', 'crew-dwarf-white'],
    recommendedPlantIds: ['plant-moss', 'plant-pothos'],
    tip: '몸을 파묻는 고습종. 깊고 촉촉한 토양과 물이끼 토퍼로 피부 보습을 유지하세요.',
  },
  'mexican-redknee-tarantula': {
    tempHotC: 28,
    tempCoolC: 24,
    humidityPct: 65,
    recommendedSubstrateIds: ['sub-organic', 'sub-leaf-litter'],
    recommendedCrewIds: ['crew-dwarf-white', 'crew-springtail'],
    recommendedPlantIds: ['plant-pothos'],
    tip: '지중성 타란튤라. 토양을 충분히 깊게 깔아 굴을 팔 수 있게 하고 과습은 피하세요.',
  },
  axolotl: {
    aquatic: true,
    tempHotC: 18,
    tempCoolC: 16,
    humidityPct: 100,
    recommendedSubstrateIds: [],
    recommendedCrewIds: [],
    recommendedPlantIds: [],
    tip: '아홀로틀은 완전 수생입니다. 토양형 바이오액티브 대신 저온 수조와 여과 사이클로 설계하세요.',
  },
}

const CATEGORY_FALLBACK: Readonly<Record<SpeciesCategory, SpeciesTemplate>> = {
  reptile: {
    tempHotC: 30,
    tempCoolC: 24,
    humidityPct: 50,
    recommendedSubstrateIds: ['sub-hydroball', 'sub-mesh', 'sub-organic', 'sub-leaf-litter'],
    recommendedCrewIds: ['crew-dairy-cow', 'crew-springtail'],
    recommendedPlantIds: ['plant-pothos'],
    tip: '파충류 일반 권장값. 종의 온습도 요구에 맞춰 배수층 유무와 토퍼를 조정하세요.',
  },
  amphibian: {
    tempHotC: 26,
    tempCoolC: 22,
    humidityPct: 80,
    recommendedSubstrateIds: ['sub-hydroball', 'sub-mesh', 'sub-organic', 'sub-sphagnum'],
    recommendedCrewIds: ['crew-springtail', 'crew-dwarf-white'],
    recommendedPlantIds: ['plant-moss', 'plant-pothos'],
    tip: '양서류는 고습이 기본. 배수층을 반드시 두고 표면 보습용 토퍼를 더하세요.',
  },
  arthropod: {
    tempHotC: 27,
    tempCoolC: 23,
    humidityPct: 65,
    recommendedSubstrateIds: ['sub-organic', 'sub-leaf-litter'],
    recommendedCrewIds: ['crew-dwarf-white', 'crew-springtail'],
    recommendedPlantIds: ['plant-pothos'],
    tip: '절지류는 종별 편차가 큼. 굴을 파는 종은 토양을 깊게, 건조종은 배수층을 빼세요.',
  },
  bird: {
    tempHotC: 26,
    tempCoolC: 20,
    humidityPct: 50,
    recommendedSubstrateIds: [],
    recommendedCrewIds: [],
    recommendedPlantIds: ['plant-pothos'],
    tip: '조류 사육장은 바이오액티브보다 청결한 평사가 일반적입니다. 식물은 무독성 종만.',
  },
  mammal: {
    tempHotC: 26,
    tempCoolC: 20,
    humidityPct: 50,
    recommendedSubstrateIds: ['sub-organic'],
    recommendedCrewIds: [],
    recommendedPlantIds: [],
    tip: '소형 포유류는 굴파기 토양 위주. 클린업 크루보다 정기 청소로 위생을 관리하세요.',
  },
}

/** Resolve a starting template by species slug, falling back to the category. */
export function templateForSpecies(
  slug: string | null | undefined,
  category: SpeciesCategory | null | undefined,
): SpeciesTemplate | null {
  if (slug && SPECIES_TEMPLATES[slug]) return SPECIES_TEMPLATES[slug]
  if (category) return CATEGORY_FALLBACK[category]
  return null
}

export function substrateById(id: string): SubstrateLayer | undefined {
  return SUBSTRATE_LAYERS.find((s) => s.id === id)
}

export function crewById(id: string): CleanupCrew | undefined {
  return CLEANUP_CREW.find((c) => c.id === id)
}

export function plantById(id: string): Plant | undefined {
  return PLANTS.find((p) => p.id === id)
}
