import type { ForumPost, ForumReply } from '../common/types'

export const FORUM_POSTS_SEED: ForumPost[] = [
  {
    id: 'seed-post-1',
    category: 'reptile',
    title: '레오파드 게코 첫 탈피, 발가락 잔존물 어떻게 처리하시나요?',
    author: '잠실집사',
    body: '입양 8주차 레오파드 게코입니다. 첫 탈피인데 발가락 끝에 잔존물이 남아서 미스팅을 30분 했는데 잘 안 떨어지네요. 다들 어떻게 처리하시는지 궁금합니다.',
    createdAt: '2026-05-20T14:30:00.000Z',
  },
  {
    id: 'seed-post-2',
    category: 'bird',
    title: '코카티엘 자유비행 시간 얼마나 주세요?',
    author: '앵무러버',
    body: '평일에는 출근 때문에 30분 정도밖에 못 빼주는데, 주말에는 4~5시간 케이지 밖에서 둡니다. 평일 시간이 부족할까요?',
    createdAt: '2026-05-22T09:15:00.000Z',
  },
  {
    id: 'seed-post-3',
    category: 'arthropod',
    title: '멕시칸 레드니 탈피 신호 정리',
    author: 'spideyy',
    body: '복부 색이 어두워지고 먹이를 거부하면 탈피 신호입니다. 이때 굴 입구를 막거나 자세가 옆으로 누우면 절대 건드리지 마세요. 1~2주 굶어도 정상.',
    createdAt: '2026-05-25T20:00:00.000Z',
  },
]

export const FORUM_REPLIES_SEED: Record<string, ForumReply[]> = {
  'seed-post-1': [
    {
      id: 'seed-reply-1',
      postId: 'seed-post-1',
      author: '게코마스터',
      body: '습도 70%까지 30분 유지 후 따뜻한 면봉으로 살살. 그래도 안 빠지면 송파특수동물의료센터 가세요. 잘못 잡아당기면 발가락 잘립니다.',
      createdAt: '2026-05-20T15:00:00.000Z',
    },
  ],
  'seed-post-3': [
    {
      id: 'seed-reply-2',
      postId: 'seed-post-3',
      author: '거미바라기',
      body: '+1 탈피 직후 24시간은 외골격 굳을 때까지 먹이도 금지요.',
      createdAt: '2026-05-25T21:00:00.000Z',
    },
  ],
}
