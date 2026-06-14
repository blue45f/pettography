import type {
  CompareDimension,
  RegistryLinks,
  SpeciesCategory,
  WildlifeFiling,
} from '../common/types'

export const REGISTRY_FILINGS_SEED: WildlifeFiling[] = [
  {
    key: 'keeping',
    title: '보관 신고',
    description:
      'Initial keeping declaration for a regulated wildlife species. Owners must register the animal with the Ministry of Environment wildlife trade and keeping system after starting to keep it.',
    dueWindowDays: 30,
    officialUrl: 'https://www.wildlife.go.kr/front/keeping/keepingApply.do',
  },
  {
    key: 'transfer',
    title: '양도·양수 신고',
    description:
      'Transfer declaration filed by both parties when a regulated wildlife species changes ownership. The receiver must attach photos of the husbandry environment.',
    dueWindowDays: 30,
    officialUrl: 'https://www.wildlife.go.kr/front/keeping/transferApply.do',
  },
  {
    key: 'death',
    title: '폐사 신고',
    description:
      'Death declaration filed when a registered wildlife animal dies. Must include the cause of death and the disposal method such as burial or animal funeral.',
    dueWindowDays: 30,
    officialUrl: 'https://www.wildlife.go.kr/front/keeping/deathApply.do',
  },
  {
    key: 'microchip',
    title: '개체식별조치 신고',
    description:
      'Individual identification filing such as microchip implantation, leg band, or other tagging method required to identify regulated wildlife individuals.',
    dueWindowDays: 30,
    officialUrl: 'https://www.wildlife.go.kr/front/keeping/identifyApply.do',
  },
]

export const REGULATED_CATEGORIES_SEED: SpeciesCategory[] = [
  'reptile',
  'amphibian',
  'bird',
  'mammal',
]

export const REGISTRY_LINKS_SEED: RegistryLinks = {
  wildlifeRegistry: 'https://www.wildlife.go.kr/',
  animalRegistry: 'https://www.animal.go.kr/',
  envMinistry: 'https://www.me.go.kr/',
}

export const COMPARE_DIMENSIONS_SEED: CompareDimension[] = [
  { key: 'category', label: '분류', type: 'category' },
  { key: 'difficulty', label: '난이도', type: 'difficulty' },
  { key: 'lifespan', label: '수명', type: 'range' },
  { key: 'space', label: '공간', type: 'enum' },
  { key: 'handling', label: '터치', type: 'enum' },
  { key: 'activity', label: '활동', type: 'enum' },
  { key: 'budget', label: '월 예산', type: 'currency' },
  { key: 'beginnerTip', label: '입문 팁', type: 'text' },
  { key: 'commonProblem', label: '흔한 트러블', type: 'text' },
]
