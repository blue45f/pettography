import type { ExternalLink } from './schema'

/**
 * 구매 순위나 검증되지 않은 민간 업체 추천을 배제한 출처 디렉터리입니다.
 * 운영 상태와 진료 가능 종은 각 기관에서 다시 확인해야 합니다.
 */
export const externalLinksMock: ExternalLink[] = [
  {
    id: 'official-protected-animals',
    name: '국가동물보호정보시스템 보호동물 조회',
    url: 'https://www.animal.go.kr/front/awtis/public/publicList.do?menuNo=1000000055',
    description:
      '지자체 보호센터의 구조·보호 동물 공고와 입양 대상 정보를 확인하는 정부 공식 시스템입니다.',
    category: 'adoption',
    speciesCategories: ['general'],
    region: '전국 온라인',
    badge: '정부 공식',
  },
  {
    id: 'official-animal-hospitals',
    name: '국가동물보호정보시스템 전국 동물병원 조회',
    url: 'https://www.animal.go.kr/front/awtis/shop/hospitalList.do?menuNo=5000000026',
    description:
      '지자체 인허가 정보가 매일 연동되는 전국 동물병원 검색입니다. 방문 전 해당 종 진료와 운영 시간을 전화로 확인하세요.',
    category: 'medical',
    speciesCategories: ['general'],
    region: '전국 온라인',
    badge: '정부 공식',
  },
  {
    id: 'snu-special-animals',
    name: '서울대학교 동물병원 야생동물·특수동물과',
    url: 'https://vmth.snu.ac.kr/subject/wildlife.do',
    description:
      '조류, 파충류, 토끼·햄스터 등 특수동물 진료 범위와 예약·전원 안내를 확인할 수 있습니다.',
    category: 'medical',
    speciesCategories: ['reptile', 'bird', 'mammal', 'general'],
    region: '서울 관악구',
    badge: '대학병원 공식',
  },
  {
    id: 'official-animal-businesses',
    name: '국가동물보호정보시스템 반려동물 영업자 조회',
    url: 'https://www.animal.go.kr/front/awtis/shop/salesList.do?menuNo=6000000130',
    description:
      '동물장묘업을 포함한 인허가 업체를 지역과 업종으로 조회합니다. 장례 계약 전 등록 상태를 확인하세요.',
    category: 'funeral',
    speciesCategories: ['general'],
    region: '전국 온라인',
    badge: '정부 공식',
  },
  {
    id: 'official-animal-law',
    name: '국가법령정보센터 동물보호법',
    url: 'https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EB%8F%99%EB%AC%BC%EB%B3%B4%ED%98%B8%EB%B2%95',
    description:
      '현행 동물보호법과 시행령·시행규칙을 원문으로 확인하는 국가 공식 법령 페이지입니다.',
    category: 'reference',
    speciesCategories: ['general'],
    region: '전국 온라인',
    badge: '정부 공식',
  },
  {
    id: 'msd-reptile-husbandry',
    name: 'MSD Veterinary Manual: Reptile Husbandry',
    url: 'https://www.msdvetmanual.com/exotic-and-laboratory-animals/reptiles/management-and-husbandry-of-reptiles',
    description:
      '파충류 환경, 온도, 습도, 조명, 위생의 수의학적 개요입니다. 개체별 처방 대신 담당 수의사 상담의 기초 자료로 활용하세요.',
    category: 'reference',
    speciesCategories: ['reptile'],
    region: '영문 온라인',
    badge: '수의학 참고',
  },
  {
    id: 'msd-reptile-nutrition',
    name: 'MSD Veterinary Manual: Reptile Nutrition',
    url: 'https://www.msdvetmanual.com/management-and-nutrition/nutrition-exotic-and-zoo-animals/nutrition-in-reptiles',
    description:
      '파충류 영양과 보충제 사용의 수의학적 개요입니다. 종, 생애 단계, 질환에 따른 급여 판단은 수의사와 상의하세요.',
    category: 'reference',
    speciesCategories: ['reptile'],
    region: '영문 온라인',
    badge: '수의학 참고',
  },
]
