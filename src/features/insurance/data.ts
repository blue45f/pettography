export interface InsuranceProvider {
  id: string
  name: string
  url: string
  coversDogCat: boolean
  coversExotic: boolean
  monthlyMin: number
  monthlyMax: number
  note: string
}

export const INSURANCE_PROVIDERS: readonly InsuranceProvider[] = [
  {
    id: 'kb',
    name: 'KB 금쪽같은 펫보험',
    url: 'https://www.kbinsure.co.kr/',
    coversDogCat: true,
    coversExotic: false,
    monthlyMin: 25000,
    monthlyMax: 60000,
    note: '강아지·고양이 한정. 일반 입원·통원·수술 보장.',
  },
  {
    id: 'db',
    name: 'DB 펫블리',
    url: 'https://www.idbins.com/',
    coversDogCat: true,
    coversExotic: false,
    monthlyMin: 22000,
    monthlyMax: 55000,
    note: '강아지·고양이. 갱신형, 입원 일당 옵션.',
  },
  {
    id: 'meritz',
    name: '메리츠 펫퍼민트',
    url: 'https://www.meritzfire.com/',
    coversDogCat: true,
    coversExotic: false,
    monthlyMin: 28000,
    monthlyMax: 80000,
    note: '강아지·고양이. 슬개골·종양 등 옵션.',
  },
  {
    id: 'samsung',
    name: '삼성화재 다이렉트 펫',
    url: 'https://direct.samsungfire.com/',
    coversDogCat: true,
    coversExotic: false,
    monthlyMin: 20000,
    monthlyMax: 50000,
    note: '강아지·고양이. 다이렉트 가입.',
  },
  {
    id: 'hyundai',
    name: '현대해상 굿앤굿 우리펫보험',
    url: 'https://www.hi.co.kr/',
    coversDogCat: true,
    coversExotic: false,
    monthlyMin: 23000,
    monthlyMax: 65000,
    note: '강아지·고양이. 1~3년 갱신.',
  },
]

export const COMPARISON_LINKS = [
  {
    id: 'banksalad',
    name: '뱅크샐러드 펫보험 비교',
    url: 'https://www.banksalad.com/articles/펫보험-비교-가격-필요성',
  },
  { id: 'bmp', name: '비마이펫 보험 비교', url: 'https://tools.mypetlife.co.kr/insurance' },
  { id: 'ipet', name: '아이펫 (반려동물 보험 비교)', url: 'https://ipet.co.kr/' },
  {
    id: 'dailyvet',
    name: '데일리벳 10개 펫보험 정리',
    url: 'https://www.dailyvet.co.kr/news/industry/209415',
  },
] as const

export function suggestedReserveKrw(monthlyBudgetKrw: number): number {
  return Math.max(50000, Math.round(monthlyBudgetKrw * 3))
}
