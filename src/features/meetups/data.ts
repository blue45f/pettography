import type { Meetup, Mentor } from './schema'

const inDays = (days: number): string => new Date(Date.now() + days * 86_400_000).toISOString()

export const SEED_MEETUPS: Meetup[] = [
  {
    id: 'seed-meetup-1',
    title: '송파 파충류 집사 번개 모임',
    host: '잠실게코',
    region: 'songpa',
    datetime: inDays(5),
    venue: '송파구 방이동 카페 테라리움',
    capacity: 12,
    description:
      '레오파드 게코·크레스티드 게코 키우는 분들 모여요. 사육장 셋업 사진 공유하고 먹이·온습도 노하우 나눕니다. 초보 환영!',
    baseAttendees: 7,
    createdAt: inDays(-14),
  },
  {
    id: 'seed-meetup-2',
    title: '강남 타란튤라 키퍼 정기 모임',
    host: 'spideyseoul',
    region: 'gangnam',
    datetime: inDays(12),
    venue: '강남구 역삼동 스터디룸 3호',
    capacity: 10,
    description:
      '절지류 사육 3개월차 이상 대상. 탈피 관리, 합사 위험성, 사육통 환기 세팅을 함께 점검합니다. 분양 정보 교환은 금지.',
    baseAttendees: 9,
    createdAt: inDays(-10),
  },
  {
    id: 'seed-meetup-3',
    title: '잠실 앵무새 산책 & 정보 교환',
    host: '코카앵무',
    region: 'jamsil',
    datetime: inDays(20),
    venue: '석촌호수 동호 잔디광장',
    capacity: 20,
    description:
      '코카티엘·왕관앵무 보호자 야외 모임입니다. 하네스 착용 필수, 자유비행 금지. 발톱·부리 관리 팁도 공유해요.',
    baseAttendees: 11,
    createdAt: inDays(-7),
  },
  {
    id: 'seed-meetup-4',
    title: '온라인 양서류 사육 Q&A 라이브',
    host: '도롱이아빠',
    region: 'online',
    datetime: inDays(3),
    venue: '구글 미트 (참석 신청 후 링크 안내)',
    capacity: 50,
    description:
      '팩맨개구리·아홀로틀 수질 관리와 먹이 급여를 주제로 한 화상 모임. 채팅으로 질문 받습니다. 신규 입문자에게 특히 추천.',
    baseAttendees: 23,
    createdAt: inDays(-5),
  },
]

export const SEED_MENTORS: Mentor[] = [
  {
    id: 'seed-mentor-1',
    name: '게코마스터',
    focus: ['reptile'],
    region: 'songpa',
    years: 9,
    bio: '레오파드·크레스티드 게코 9년차. 첫 탈피 관리와 거식 대처를 가장 많이 도와드립니다. 송파 거주, 주말 오프라인 미팅도 가능해요.',
    contact: 'https://open.kakao.com/o/gecko-mentor',
    createdAt: inDays(-30),
  },
  {
    id: 'seed-mentor-2',
    name: 'spideyy',
    focus: ['arthropod'],
    region: 'gangnam',
    years: 6,
    bio: '타란튤라·전갈 사육 6년. 종별 습도 세팅과 안전한 핸들링(또는 비핸들링) 원칙을 알려드려요. 사진 보내주시면 탈피 전조도 봐드립니다.',
    contact: 'https://open.kakao.com/o/spidey-room',
    createdAt: inDays(-28),
  },
  {
    id: 'seed-mentor-3',
    name: '앵무러버',
    focus: ['bird'],
    region: 'jamsil',
    years: 12,
    bio: '코카티엘·소형 앵무 12년 경력. 합사, 발정 관리, 클리커 트레이닝 상담 가능합니다. 초보 보호자 환영, 부담 없이 메일 주세요.',
    contact: 'parrot.mentor@example.com',
    createdAt: inDays(-25),
  },
  {
    id: 'seed-mentor-4',
    name: '도롱이아빠',
    focus: ['amphibian', 'reptile'],
    region: 'online',
    years: 5,
    bio: '양서류·소형 파충류 5년차. 아홀로틀 수질과 팩맨개구리 셋업이 주특기입니다. 온라인 위주로 도와드려요.',
    contact: 'https://open.kakao.com/o/amphibian-help',
    createdAt: inDays(-20),
  },
]
