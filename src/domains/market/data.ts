import type { Listing } from './schema'

/**
 * Seed classifieds. Mixes priced listings with first-class "무료 나눔" (free rehoming)
 * entries, and includes a regulated species (볼파이톤) to exercise the filing warning.
 */
export const SEED_LISTINGS: Listing[] = [
  {
    id: 'seed-market-1',
    author: '송파브리더',
    speciesId: 'sp-ball-python',
    category: 'reptile',
    title: '볼파이톤 파스텔 (2025년 9월 해칭, CB)',
    morph: '파스텔',
    isFree: false,
    priceKrw: 150000,
    region: 'songpa',
    cbStatus: 'cb',
    contact: 'https://open.kakao.com/o/example-ballpython',
    description:
      '직접 브리딩한 파스텔 모프 베이비입니다. 핑키 자가 급여 완료, 거식 없이 잘 먹습니다. 직거래 시 사육 환경·먹이 이력 상세히 안내드립니다. 규제종이라 보관신고 안내도 함께 드려요.',
    createdAt: '2026-05-26T10:00:00.000Z',
  },
  {
    id: 'seed-market-2',
    author: '게코하우스',
    speciesId: 'sp-crested-gecko',
    category: 'reptile',
    title: '크레스티드 게코 할리퀸 준성체 분양',
    morph: '할리퀸',
    isFree: false,
    priceKrw: 90000,
    region: 'gangnam',
    cbStatus: 'cb',
    contact: 'seoul.crestie@example.com',
    description:
      'CB 개체로 발색 좋은 할리퀸입니다. 핸들링 무난하고 거버 푸드 잘 먹습니다. 강남 직거래 가능, 분양 후에도 사육 상담 도와드립니다.',
    createdAt: '2026-05-25T13:30:00.000Z',
  },
  {
    id: 'seed-market-3',
    author: '잠실파충관',
    speciesId: 'sp-corn-snake',
    category: 'reptile',
    title: '성체 콘스네이크 무료 분양 — 책임분양 받습니다',
    morph: '아네리',
    isFree: true,
    priceKrw: null,
    region: 'jamsil',
    cbStatus: 'cb',
    contact: 'https://open.kakao.com/o/example-cornsnake',
    description:
      '사정상 더 키우기 어려워 책임 분양 보냅니다. 온순하고 건강한 성체입니다. 사육 경험 있으신 분, 끝까지 책임지실 분께만 무료로 보내드립니다. 사육장은 별도 양도 가능.',
    createdAt: '2026-05-24T19:00:00.000Z',
  },
  {
    id: 'seed-market-4',
    author: '거미공방',
    speciesId: 'sp-mexican-redknee',
    category: 'arthropod',
    title: '멕시칸 레드니 스파이더링 (CB)',
    morph: '',
    isFree: false,
    priceKrw: 45000,
    region: 'online',
    cbStatus: 'cb',
    contact: 'https://www.instagram.com/example-tarantula',
    description:
      'CB 스파이더링입니다. 2령으로 먹이 반응 좋습니다. 안전 포장 후 택배 분양 가능(생체 택배 규정 준수). 입문자도 키우기 무난한 종입니다.',
    createdAt: '2026-05-23T11:15:00.000Z',
  },
  {
    id: 'seed-market-5',
    author: '앵무지기',
    speciesId: 'sp-budgerigar',
    category: 'bird',
    title: '잉꼬 한 쌍 무료 나눔 (사육장 포함)',
    morph: '',
    isFree: true,
    priceKrw: null,
    region: 'songpa',
    cbStatus: 'cb',
    contact: '010-0000-0000 (문자 문의)',
    description:
      '이사로 인해 함께 지내던 잉꼬 한 쌍을 책임 분양합니다. 사육장·먹이통 모두 포함해서 드립니다. 새를 끝까지 아껴주실 가정을 찾습니다. 직접 픽업 가능하신 분만 연락주세요.',
    createdAt: '2026-05-22T09:40:00.000Z',
  },
  {
    id: 'seed-market-6',
    author: '비어디집',
    speciesId: 'sp-bearded-dragon',
    category: 'reptile',
    title: '비어디드 드래곤 베이비 분양 (CB)',
    morph: '시트러스',
    isFree: false,
    priceKrw: 120000,
    region: 'other',
    cbStatus: 'cb',
    contact: 'https://open.kakao.com/o/example-beardie',
    description:
      '자가 브리딩 시트러스 베이비입니다. 귀뚜라미·야채 모두 잘 먹습니다. UVB·온도 세팅 안내 자료 함께 드리고, 분양 후에도 사육 질문 환영합니다.',
    createdAt: '2026-05-21T15:20:00.000Z',
  },
]
