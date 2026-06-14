import type { SpeciesCategory } from '@domains/species'

export interface EmergencyChecklistItem {
  id: string
  symptom: string
  action: string
  severity: 'critical' | 'high' | 'watch'
}

export interface CategoryEmergency {
  category: SpeciesCategory
  intro: string
  items: EmergencyChecklistItem[]
}

export const EMERGENCY_CHECKLISTS: readonly CategoryEmergency[] = [
  {
    category: 'reptile',
    intro:
      '파충류는 체온·탈피·먹이 거부가 응급 신호의 80%. 환경부터 점검하고 30분 안에 핫스팟 정상화가 우선.',
    items: [
      {
        id: 'r-temp',
        symptom: '핫스팟 온도가 28℃ 이하 또는 38℃ 이상',
        action: '램프·서모스탯 점검, 정상 범위 회복 후에도 무기력하면 응급 진료',
        severity: 'critical',
      },
      {
        id: 'r-shed',
        symptom: '탈피 잔존물이 발가락·꼬리에 24시간 이상 남음',
        action: '습도 70%까지 미스팅 30분, 따뜻한 면봉으로 살살. 안 빠지면 진료',
        severity: 'high',
      },
      {
        id: 'r-eat',
        symptom: '5일 이상 거식 + 체중 10% 이상 감소',
        action: '환경 확인 후에도 지속되면 진료. 자체 강제 급여 금지',
        severity: 'high',
      },
      {
        id: 'r-mbd',
        symptom: '갑 휘어짐·턱 변형·후지 마비',
        action: 'MBD 의심. UVB·칼슘 즉시 보완, 진료 빠를수록 좋음',
        severity: 'high',
      },
      {
        id: 'r-prolapse',
        symptom: '총배설강 탈출(분홍·붉은 조직 노출)',
        action: '습한 면포로 보호하며 즉시 응급 진료',
        severity: 'critical',
      },
    ],
  },
  {
    category: 'arthropod',
    intro: '타란튤라·전갈은 외관 변화·자세가 응급 신호. 핸들링 자제하고 환경 안정이 최우선.',
    items: [
      {
        id: 'a-molt',
        symptom: '탈피 자세로 24시간 이상 굳어 있음(옆으로 누운 자세)',
        action: '절대 건드리지 말고 습도 70% 유지. 보통 정상 과정',
        severity: 'watch',
      },
      {
        id: 'a-leak',
        symptom: '관절·복부에서 체액 누출',
        action: '깨끗한 코코피트로 압박 지혈, 응급 진료(특수동물 병원)',
        severity: 'critical',
      },
      {
        id: 'a-fall',
        symptom: '낙상 후 다리 절단 또는 자세 비정상',
        action: '습도 80%로 24~48시간 유지하며 관찰. 출혈 지속 시 진료',
        severity: 'high',
      },
      {
        id: 'a-stress',
        symptom: '자극모 발사·집중 공격 자세 반복',
        action: '핸들링 즉시 중단, 사육장 어두운 환경으로 복귀',
        severity: 'watch',
      },
    ],
  },
  {
    category: 'bird',
    intro:
      '조류는 증상이 보이면 이미 심각한 단계. 깃털 부풀리기·바닥 앉음·호흡 변화 셋 중 하나라도 진료.',
    items: [
      {
        id: 'b-fluff',
        symptom: '낮 시간에 깃털을 부풀리고 졸음',
        action: '체온 저하·감염 의심. 즉시 보온(28~30℃) + 진료',
        severity: 'critical',
      },
      {
        id: 'b-breath',
        symptom: '꼬리 흔들림 동반 호흡·입 벌리고 숨쉼',
        action: '호흡기 응급. 24시 응급 병원으로 즉시 이동',
        severity: 'critical',
      },
      {
        id: 'b-droppings',
        symptom: '변 색·점성이 평소와 다르게 24시간 이상 지속',
        action: '식이·환경 변화 점검 후 진료 예약',
        severity: 'high',
      },
      {
        id: 'b-fly-injury',
        symptom: '자유 비행 중 충돌·창문 부딪힘',
        action: '뇌진탕·골절 가능성. 어두운 박스에 안정시키고 진료',
        severity: 'high',
      },
    ],
  },
  {
    category: 'amphibian',
    intro: '양서류는 수질·수온이 응급 신호의 90%. 물 갈이부터.',
    items: [
      {
        id: 'amp-temp',
        symptom: '아홀로틀 수온 22℃ 이상 24시간 이상',
        action: '즉시 쿨러 가동·얼음팩 외부 부착. 24℃ 초과 지속 시 폐사 위험',
        severity: 'critical',
      },
      {
        id: 'amp-fungus',
        symptom: '아가미 외엽 또는 몸에 흰 솜털',
        action: '곰팡이 감염. 수질 교체 + 진료(아쿠아펫몰·아쿠아클리닉)',
        severity: 'high',
      },
      {
        id: 'amp-float',
        symptom: '계속 수면에 떠 있고 가라앉지 못함',
        action: '소화불량 또는 수질. 24시간 단식 + 수질 교체 후 재평가',
        severity: 'high',
      },
    ],
  },
  {
    category: 'mammal',
    intro: '소형 포유류는 보온과 수분이 1순위. 12시간 안 먹으면 응급.',
    items: [
      {
        id: 'm-temp',
        symptom: '헷지호그·슈가글라이더 실내 22℃ 이하',
        action: '동면 시도 후 깨어나지 못할 위험. 즉시 24~28℃로 보온',
        severity: 'critical',
      },
      {
        id: 'm-eat',
        symptom: '12시간 이상 사료·물 거부',
        action: '대사 저하 위험. 따뜻한 물 시린지 급여 후 응급 진료',
        severity: 'critical',
      },
      {
        id: 'm-wheel',
        symptom: '헷지호그 보행 비정상(다리 끌기·휘청)',
        action: 'WHS 또는 신경 증상. 영상 촬영 후 진료(목동·청담)',
        severity: 'high',
      },
      {
        id: 'm-self-harm',
        symptom: '슈가글라이더 단독 사육 후 자해·우울',
        action: '동성 합사 모색. 출혈·감염 시 진료',
        severity: 'high',
      },
    ],
  },
] as const

export const NATIONAL_HOTLINES: readonly {
  id: string
  name: string
  url: string
  phone?: string
}[] = [
  {
    id: 'animal-go-kr',
    name: '국가동물보호정보시스템(농림축산검역본부)',
    url: 'https://www.animal.go.kr',
    phone: '1577-0954',
  },
  {
    id: 'animals-or-kr',
    name: '동물자유연대 응급/구조 안내',
    url: 'https://www.animals.or.kr',
  },
] as const

export function findChecklist(
  category: SpeciesCategory | null | undefined
): CategoryEmergency | undefined {
  if (!category) return undefined
  return EMERGENCY_CHECKLISTS.find((c) => c.category === category)
}
