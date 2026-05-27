import type { ExternalLink } from './schema'

/**
 * 한국 반려동물(일반·희귀 포함) 큐레이션 외부 링크 모음.
 * 모든 URL은 WebSearch/WebFetch로 실재 확인된 사이트만 포함합니다.
 * - `speciesCategories`에 `general`이 포함된 항목은 전 종(species) 화면에 노출됩니다.
 * - 특정 카테고리(`reptile` 등)만 포함하면 해당 종 화면에서만 노출됩니다.
 */
export const externalLinksMock: ExternalLink[] = [
  // -------------------------------------------------------------------------
  // adoption / 입양·분양
  // -------------------------------------------------------------------------
  {
    id: 'ext-adoption-animal-go-kr',
    name: '국가동물보호정보시스템',
    url: 'https://www.animal.go.kr/',
    description:
      '농림축산검역본부가 운영하는 정부 공식 시스템. 전국 보호소 유기동물 검색·입양 신청·동물등록 조회를 한 곳에서 처리할 수 있습니다.',
    category: 'adoption',
    speciesCategories: ['general'],
    region: '전국 온라인',
    badge: '정부 공식',
  },
  {
    id: 'ext-adoption-animals-or-kr',
    name: '동물자유연대',
    url: 'https://www.animals.or.kr/',
    description:
      '국내 최대 규모 동물보호단체. 보호소 입양 매칭, 임시보호 모집, 학대신고를 운영하며 반려동물 복지 캠페인을 주도합니다.',
    category: 'adoption',
    speciesCategories: ['general'],
    region: '전국',
    badge: '비영리 인증',
  },
  {
    id: 'ext-adoption-ekara',
    name: '동물권행동 카라(KARA)',
    url: 'https://www.ekara.org/',
    description:
      '카라 더봄센터를 중심으로 입양 상담·교육·중성화 후 분양을 진행하는 사단법인. 입양비 7만원은 의료비/보호소 후원금으로 사용됩니다.',
    category: 'adoption',
    speciesCategories: ['general'],
    region: '경기 파주(더봄센터)',
    badge: '사단법인',
  },
  {
    id: 'ext-adoption-karma',
    name: '한국동물구조관리협회(KARMA)',
    url: 'https://www.karma.or.kr/',
    description:
      '경기·인천 지역 유기동물 구조·보호 위탁기관. 구조 동물 입양 공고와 위탁 보호 시설을 운영합니다.',
    category: 'adoption',
    speciesCategories: ['mammal', 'general'],
    region: '경기 양주',
    badge: '지자체 위탁',
  },
  {
    id: 'ext-adoption-seoulreptile',
    name: '서울렙타일',
    url: 'https://www.seoulreptile.co.kr/',
    description:
      '서울 중구 충정로 소재 희귀반려동물 전문 오프라인·온라인 샵. 게코·뱀·거북·개구리·앵무 분양과 사육용품을 함께 취급합니다.',
    category: 'adoption',
    speciesCategories: ['reptile', 'amphibian', 'bird'],
    region: '서울 중구',
  },
  {
    id: 'ext-adoption-cityparrot',
    name: '시티패럿',
    url: 'http://cityparrot.co.kr/',
    description:
      '서울랜드·이천에서 운영되는 앵무새 교감·체험·분양 전문 시설. 종별 사육 난이도 안내와 입양 전 체험 프로그램을 제공합니다.',
    category: 'adoption',
    speciesCategories: ['bird'],
    region: '경기 과천·이천',
  },

  // -------------------------------------------------------------------------
  // shopping / 쇼핑·먹이·용품
  // -------------------------------------------------------------------------
  {
    id: 'ext-shopping-pet-friends',
    name: '펫프렌즈',
    url: 'https://www.pet-friends.co.kr/',
    description:
      '국내 1위 반려동물 종합 쇼핑몰. 서울·경기 새벽배송과 전국 당일배송, 사료·간식·용품·약품 큐레이션을 제공합니다.',
    category: 'shopping',
    speciesCategories: ['mammal', 'general'],
    region: '전국 온라인',
    badge: '새벽배송',
  },
  {
    id: 'ext-shopping-petbox',
    name: '펫박스',
    url: 'https://www.petbox.kr/',
    description:
      '실시간 최저가 비교와 펫케어 라이프 매니저 상담을 결합한 종합 쇼핑몰. 24시간 새벽배송 지원.',
    category: 'shopping',
    speciesCategories: ['mammal', 'general'],
    region: '전국 온라인',
  },
  {
    id: 'ext-shopping-aboutpet',
    name: '어바웃펫',
    url: 'https://www.aboutpet.co.kr/',
    description:
      'GS리테일 계열 반려동물 종합 쇼핑몰. 사료/간식 정기구독, 동물병원 처방 사료 카테고리를 운영합니다.',
    category: 'shopping',
    speciesCategories: ['mammal', 'general'],
    region: '전국 온라인',
  },
  {
    id: 'ext-shopping-danawa-pet',
    name: '다나와 펫 카테고리',
    url: 'https://www.danawa.com/',
    description:
      '사료·캣타워·자동급식기 등 펫 가전을 스펙·가격 비교할 수 있는 국내 대표 가격비교 사이트.',
    category: 'shopping',
    speciesCategories: ['general'],
    region: '전국 온라인',
    badge: '가격비교',
  },
  {
    id: 'ext-shopping-thejurassic',
    name: '뉴런쥬라기',
    url: 'https://thejurassic.co.kr/',
    description:
      '대구 소재 희귀 파충류 전문 쇼핑몰. 도마뱀·뱀·거북·양서류·절지류 분양과 사육장·UVB 조명·온열기를 취급합니다.',
    category: 'shopping',
    speciesCategories: ['reptile', 'amphibian', 'arthropod'],
    region: '대구',
  },
  {
    id: 'ext-shopping-geckovillage',
    name: '게코빌리지',
    url: 'https://geckovillage.co.kr/',
    description:
      '인천 부평 게코 전문점. 크레/레오/가고일 게코를 직접수령·퀵 원칙으로 분양하며 사육용품 라인업이 넓습니다.',
    category: 'shopping',
    speciesCategories: ['reptile'],
    region: '인천 부평구',
  },
  {
    id: 'ext-shopping-theraphosidae',
    name: '거미랑',
    url: 'https://theraphosidae.co.kr/',
    description:
      '국내 최대 규모 절지동물 전문 셀렉트샵. 타란튤라·전갈·지네 등 절지류와 전용 사육장·바닥재·은신처를 판매합니다.',
    category: 'shopping',
    speciesCategories: ['arthropod'],
    region: '전국 온라인',
  },
  {
    id: 'ext-shopping-animalfriends',
    name: '애니멀프렌즈',
    url: 'https://animalfriends.co.kr/',
    description:
      '경기 시흥 본점의 소형 포유류·앵무·파충류·양서류 종합 분양·용품샵. 햄스터·기니피그·고슴도치·페릿까지 폭넓게 취급.',
    category: 'shopping',
    speciesCategories: ['mammal', 'bird', 'reptile', 'amphibian'],
    region: '경기 시흥',
  },

  // -------------------------------------------------------------------------
  // medical / 동물병원·진료
  // -------------------------------------------------------------------------
  {
    id: 'ext-medical-snu-vmth',
    name: '서울대학교 수의과대학 동물병원',
    url: 'https://vmth.snu.ac.kr/',
    description:
      '국내 최상위 3차 의뢰 동물병원. 야생·특수동물과에서 앵무·거북·도마뱀·토끼·햄스터 등 희귀종 진료를 수행합니다.',
    category: 'medical',
    speciesCategories: ['general'],
    region: '서울 관악구',
    badge: '대학병원',
  },
  {
    id: 'ext-medical-ecoanimal',
    name: '에코특수동물병원',
    url: 'https://ecoanimal.co.kr/',
    description:
      '서울 송파구 소재 국내 최대 규모 특수동물 전문 병원. 파충류·조류·고슴도치·기니피그 치과까지 20여 종을 진료합니다.',
    category: 'medical',
    speciesCategories: ['reptile', 'amphibian', 'bird', 'mammal'],
    region: '서울 송파구',
    badge: '특수동물 전문',
  },
  {
    id: 'ext-medical-acrisamc',
    name: '아크리스 동물의료센터',
    url: 'http://acrisamc.co.kr/',
    description:
      '강남구 봉은사역 인근 특수동물 의료센터. 파충류·조류·설치류·포유류 진료가 가능합니다.',
    category: 'medical',
    speciesCategories: ['reptile', 'bird', 'mammal'],
    region: '서울 강남구',
    badge: '특수동물 전문',
  },
  {
    id: 'ext-medical-chungdamah',
    name: '청담우리동물병원',
    url: 'https://www.chungdamah.co.kr/',
    description: '서울 강남구 청담동 종합 동물병원. 일반 진료·외과·치과를 종합 운영합니다.',
    category: 'medical',
    speciesCategories: ['mammal', 'general'],
    region: '서울 강남구',
  },
  {
    id: 'ext-medical-helix-amc',
    name: '헬릭스동물메디컬센터',
    url: 'https://helix-amc.com/',
    description:
      '서울 서초/일산 운영 2차 종합 동물병원. 24시간 응급의료, 국내 최초 MRI·CT 영상진단센터를 보유합니다.',
    category: 'medical',
    speciesCategories: ['mammal', 'general'],
    region: '서울 서초구·고양 일산',
    badge: '24시 응급',
  },
  {
    id: 'ext-medical-bonamc',
    name: '24시 본동물의료센터',
    url: 'https://bonamc.co.kr/',
    description:
      '난치성·노령 환자를 위한 2차 의뢰 병원. 365일 24시간 응급진료 및 중환자 케어를 제공합니다.',
    category: 'medical',
    speciesCategories: ['mammal', 'general'],
    region: '서울',
    badge: '24시 응급',
  },
  {
    id: 'ext-medical-qia-protect',
    name: '농림축산검역본부 동물보호',
    url: 'https://www.qia.go.kr/animal/protect/ani_prot_ani_regist.jsp',
    description:
      '동물등록제·동물판매업·장묘업 등록 절차 안내. 동물보호 법령 변경사항을 공식 고시합니다.',
    category: 'medical',
    speciesCategories: ['general'],
    region: '전국 온라인',
    badge: '정부 공식',
  },

  // -------------------------------------------------------------------------
  // funeral / 장례·추모
  // -------------------------------------------------------------------------
  {
    id: 'ext-funeral-21gram',
    name: '21그램',
    url: 'https://21gram.co.kr/',
    description:
      '경기 광주·천안 아산·남양주 3개 지점을 운영하는 합법 반려동물 장례식장. 농림축산식품부 장관상을 수상한 동물복지 인증 업체.',
    category: 'funeral',
    speciesCategories: ['general'],
    region: '경기·충남',
    badge: '농식품부 인증',
  },
  {
    id: 'ext-funeral-petforest',
    name: '펫포레스트',
    url: 'https://petforest.co.kr/',
    description:
      '경기 광주·김포·남양주 3개 지점의 반려동물 장례식장. 추모보석(루세떼) 제작과 차량 픽업 서비스를 제공합니다.',
    category: 'funeral',
    speciesCategories: ['general'],
    region: '경기',
    badge: '7년 연속 브랜드대상',
  },
  {
    id: 'ext-funeral-qia-die',
    name: '농림축산검역본부 동물장묘업',
    url: 'https://www.qia.go.kr/animal/protect/ani_prot_ani_die_resist.jsp',
    description:
      '합법 동물장묘업 등록 업체 검색과 등록 절차 안내. 미등록 업체 피해를 막기 위한 정부 공식 정보.',
    category: 'funeral',
    speciesCategories: ['general'],
    region: '전국 온라인',
    badge: '정부 공식',
  },

  // -------------------------------------------------------------------------
  // community / 커뮤니티·콘텐츠
  // -------------------------------------------------------------------------
  {
    id: 'ext-community-dc-reptile',
    name: '디시인사이드 파충류·양서류 갤러리',
    url: 'https://gall.dcinside.com/board/lists/?id=reptile',
    description:
      '2004년 개설된 국내 최대 파충류·양서류 커뮤니티. 사육장 셋업·온습도·먹이 교체 등 실전 노하우가 가장 빠르게 공유됩니다.',
    category: 'community',
    speciesCategories: ['reptile', 'amphibian'],
    region: '전국 온라인',
    badge: '국내 최대',
  },
  {
    id: 'ext-community-mypetlife',
    name: '비마이펫 라이프',
    url: 'https://mypetlife.co.kr/',
    description:
      '강아지·고양이 연구소, 위키백과, Q&A 게시판을 갖춘 반려동물 지식 콘텐츠 채널. 평균 12시간 내 전문가 답변 운영.',
    category: 'community',
    speciesCategories: ['mammal', 'general'],
    region: '전국 온라인',
  },
  {
    id: 'ext-community-bemypet',
    name: '비마이펫',
    url: 'https://bemypet.kr/',
    description:
      '반려동물 콘텐츠 플랫폼. 입양 후기·웹툰·이벤트 게시판 등 커뮤니티 기능 중심으로 운영됩니다.',
    category: 'community',
    speciesCategories: ['mammal', 'general'],
    region: '전국 온라인',
  },
  {
    id: 'ext-community-petsbe',
    name: '펫츠비',
    url: 'https://www.petsbe.com/',
    description:
      '수의사가 직접 운영하는 반려동물 전문 플랫폼. 건강·행동·영양 정보가 검증된 형태로 제공됩니다.',
    category: 'community',
    speciesCategories: ['mammal', 'general'],
    region: '전국 온라인',
    badge: '수의사 운영',
  },

  // -------------------------------------------------------------------------
  // reference / 정보·뉴스·법령
  // -------------------------------------------------------------------------
  {
    id: 'ext-reference-dailyvet',
    name: '데일리벳',
    url: 'https://www.dailyvet.co.kr/',
    description:
      '국내 수의사 신문. 반려·농장·야생·실험동물 정책과 임상 뉴스를 가장 빠르게 다루는 전문 매체.',
    category: 'reference',
    speciesCategories: ['general'],
    region: '전국 온라인',
    badge: '수의사 매체',
  },
  {
    id: 'ext-reference-law-animal',
    name: '국가법령정보센터 - 동물보호법',
    url: 'https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EB%8F%99%EB%AC%BC%EB%B3%B4%ED%98%B8%EB%B2%95',
    description:
      '동물보호법 원문과 시행령·시행규칙 최신 개정 본문을 즉시 확인할 수 있는 정부 공식 법령정보센터.',
    category: 'reference',
    speciesCategories: ['general'],
    region: '전국 온라인',
    badge: '정부 공식',
  },
  {
    id: 'ext-reference-meritz-petpermint',
    name: '메리츠화재 펫퍼민트',
    url: 'https://store.meritzfire.com/pet/direct-lndB01/contract.do',
    description:
      '강아지·고양이 대상 통원·입원 의료비 최대 1,500만원 보장 펫보험. 국내 점유율 1위 펫보험 상품.',
    category: 'reference',
    speciesCategories: ['mammal'],
    region: '전국 온라인',
    badge: '펫보험 1위',
  },
  {
    id: 'ext-reference-samsung-pet',
    name: '삼성화재 다이렉트 펫보험',
    url: 'https://direct.samsungfire.com/ria/pc/product/pet/',
    description:
      '삼성화재 다이렉트 채널의 반려견·반려묘 의료비 보장 상품. 보험료 다이렉트 견적 산정이 가능합니다.',
    category: 'reference',
    speciesCategories: ['mammal'],
    region: '전국 온라인',
  },
]
