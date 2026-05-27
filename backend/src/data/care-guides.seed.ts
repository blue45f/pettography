import type { CareGuide } from '../common/types';

export const CARE_GUIDES_SEED: CareGuide[] = [
  {
    id: 'cg-001',
    speciesId: 'sp-001',
    sections: [
      {
        title: '사육 환경',
        body: '바닥재는 페이퍼타올 또는 타일 권장. 핫스팟 32°C, 쿨존 24°C 그라데이션을 유지하고 야간엔 22°C 이상이면 무가온도 가능.',
      },
      {
        title: '먹이',
        body: '주 2~3회, 머리 폭만 한 곤충(귀뚜라미, 두비아, 밀웜)에 칼슘 더스팅. 비타민D3는 주 1회.',
      },
      {
        title: '주의 사항',
        body: '꼬리에 지방을 저장하므로 비만 관리 필수. 모래류 바닥재는 임팩션 위험.',
      },
    ],
    references: [
      {
        label: 'Reptifiles - Leopard Gecko Care',
        url: 'https://reptifiles.com/leopard-gecko-care/',
      },
    ],
  },
  {
    id: 'cg-002',
    speciesId: 'sp-002',
    sections: [
      {
        title: '사육 환경',
        body: '수직형 케이지에 식물·코르크보드 다수 배치. 습도 60~80% 유지를 위한 매일 1~2회 분무.',
      },
      {
        title: '먹이',
        body: 'CGD 분말 사료를 물에 개어 격일 급여. 단백질 보충용 곤충은 주 1회.',
      },
      {
        title: '주의 사항',
        body: '꼬리가 한번 떨어지면 재생되지 않음. 핸들링 시 점프에 주의.',
      },
    ],
    references: [{ label: 'Pangea Reptile Guides', url: 'https://www.pangeareptile.com/' }],
  },
  {
    id: 'cg-003',
    speciesId: 'sp-003',
    sections: [
      {
        title: '사육 환경',
        body: '90cm 이상 수평 케이지, 은신처 2개(웜·쿨), 그라데이션 24~30°C.',
      },
      {
        title: '먹이',
        body: '몸통 굵기의 1~1.5배 마우스를 주 1회. 탈피 직전엔 급여 생략.',
      },
      {
        title: '주의 사항',
        body: '탈출의 명수. 케이지 락 필수. 핸들링은 탈피 후 48시간 뒤에.',
      },
    ],
    references: [
      {
        label: 'Corn Snake Care Sheet (Reptifiles)',
        url: 'https://reptifiles.com/corn-snake-care/',
      },
    ],
  },
  {
    id: 'cg-004',
    speciesId: 'sp-004',
    sections: [
      {
        title: '사육 환경',
        body: '가로형 30x30cm 지상형 사육장, 코코피트 10cm 이상, 은신처와 얕은 물그릇.',
      },
      {
        title: '먹이',
        body: '주 1~2회 살아있는 귀뚜라미·두비아. 단식기를 가질 수 있으니 무리하게 급여하지 않음.',
      },
      {
        title: '주의 사항',
        body: '핸들링 비권장. 자극받으면 헤어로 자극모를 털어낼 수 있음.',
      },
    ],
    references: [{ label: 'Tarantula Forum Care Sheets', url: 'https://arachnoboards.com/' }],
  },
  {
    id: 'cg-005',
    speciesId: 'sp-005',
    sections: [
      {
        title: '사육 환경',
        body: '45L 이상 케이지, 야자토 10cm, 은신처 2개. 분무 1일 1회로 70~80% 유지.',
      },
      {
        title: '먹이',
        body: '주 1회 귀뚜라미·두비아. 어린 개체는 좀 더 자주 급여.',
      },
      {
        title: '주의 사항',
        body: '독성은 약하지만 알러지 반응 가능. 새끼를 등에 업는 모성행동 관찰 가능.',
      },
    ],
    references: [{ label: 'Arachnoboards Scorpion Care', url: 'https://arachnoboards.com/' }],
  },
  {
    id: 'cg-006',
    speciesId: 'sp-006',
    sections: [
      {
        title: '사육 환경',
        body: '가로형 케이지에 횃대 다양화. 매일 4~6시간 케이지 밖 자유시간 권장.',
      },
      {
        title: '먹이',
        body: '펠릿 70% + 시드 20% + 신선 야채/과일 10%. 아보카도/초콜릿 절대 금지.',
      },
      {
        title: '주의 사항',
        body: '먼지에 민감. 공기청정기 및 정기 케이지 청소 필수.',
      },
    ],
    references: [{ label: 'World Parrot Trust - Cockatiel', url: 'https://www.parrots.org/' }],
  },
  {
    id: 'cg-007',
    speciesId: 'sp-007',
    sections: [
      {
        title: '사육 환경',
        body: '60x50x80cm 이상 케이지, 다양한 횃대와 장난감, 매일 2시간 이상 방생.',
      },
      {
        title: '먹이',
        body: '펠릿 위주, 신선 야채·과일 적절히. 해바라기씨·땅콩 과다 금지.',
      },
      {
        title: '주의 사항',
        body: '깨물기 습관 교정 필요. 시각·청각 자극 풍부하게 제공.',
      },
    ],
    references: [{ label: 'World Parrot Trust - Conure', url: 'https://www.parrots.org/' }],
  },
  {
    id: 'cg-008',
    speciesId: 'sp-008',
    sections: [
      {
        title: '사육 환경',
        body: '60cm 수조, 모래나 매끄러운 타일 바닥재. 수온 16~20°C 유지 (여름엔 쿨러 필수).',
      },
      {
        title: '먹이',
        body: '냉동 블러드웜·전용 펠릿 격일 급여. 작은 자갈은 임팩션 위험.',
      },
      {
        title: '주의 사항',
        body: '단독 사육 권장. 수질 관리(스폰지 필터 + 주 1회 환수)가 핵심.',
      },
    ],
    references: [{ label: 'Axolotl.org Care Guide', url: 'http://www.axolotl.org/' }],
  },
  {
    id: 'cg-009',
    speciesId: 'sp-009',
    sections: [
      {
        title: '사육 환경',
        body: '30cm 지상형 사육장, 야자토 + 이끼로 습도 70% 이상 유지. 얕은 물그릇.',
      },
      {
        title: '먹이',
        body: '주 1~2회 살아있는 귀뚜라미. 성체는 가끔 핑키 마우스.',
      },
      {
        title: '주의 사항',
        body: '활동량이 적어 비만 위험. 너무 자주 급여하지 않을 것.',
      },
    ],
    references: [
      { label: 'Pacman Frog Care - Reptifiles', url: 'https://reptifiles.com/pacman-frog-care/' },
    ],
  },
  {
    id: 'cg-010',
    speciesId: 'sp-010',
    sections: [
      {
        title: '사육 환경',
        body: '최소 90cm 수직형 케이지, 활공·등반 구조물 다수. 본딩 시간 매일 1시간 이상.',
      },
      {
        title: '먹이',
        body: 'TPG/HPW 등 영양 균형 식단 + 곤충(밀웜 등) + 과일 소량.',
      },
      {
        title: '주의 사항',
        body: '단독 사육 시 우울증 위험. 최소 2마리 이상 권장. 야행성이므로 낮 활동 최소화.',
      },
    ],
    references: [{ label: 'Sugar Glider Info', url: 'https://www.sugargliderinfo.org/' }],
  },
  {
    id: 'cg-011',
    speciesId: 'sp-011',
    sections: [
      {
        title: '사육 환경',
        body: '24~28°C 일정 유지가 가장 중요. 겨울철 보온 패드 필수, 외풍 차단.',
      },
      {
        title: '먹이',
        body: '고슴도치 전용 사료 또는 저지방 고양이 사료. 밀웜·귀뚜라미 간식.',
      },
      {
        title: '주의 사항',
        body: '단독 사육 필수. 가시털 알러지 반응 확인 필요.',
      },
    ],
    references: [{ label: 'Hedgehog Welfare Society', url: 'https://hedgehogwelfare.org/' }],
  },
];
