import type { CareGuide } from './schema'

export const careGuidesMock: CareGuide[] = [
  {
    id: 'cg-leopard-gecko',
    speciesId: 'sp-leopard-gecko',
    sections: [
      {
        title: '사육장 셋업',
        body: '30×30×30cm 이상 가로형, 핫스팟 32℃ / 쿨존 24℃로 온도 구배. 은신처 2개(웜+쿨), 미스팅으로 습도 35% 유지.',
      },
      {
        title: '먹이 루틴',
        body: '주 2~3회 귀뚜라미 또는 밀웜, 칼슘+D3 더스팅 주 1회, 멀티비타민 격주.',
      },
      {
        title: '건강 체크',
        body: '꼬리 두께(영양 상태), 탈피 잔존물(특히 발가락), 변 색상·빈도 주 1회 점검.',
      },
    ],
    references: [
      { label: '국립생물자원관 종 정보', url: 'https://species.nibr.go.kr' },
      { label: 'Reptiles Magazine - Leopard Gecko Care', url: 'https://www.reptilesmagazine.com' },
    ],
  },
  {
    id: 'cg-crested-gecko',
    speciesId: 'sp-crested-gecko',
    sections: [
      {
        title: '사육장 셋업',
        body: '수직형 30×30×45cm 이상, 코르크 가지·인공 식물 다수 배치. 분무로 습도 60~80% 사이클.',
      },
      {
        title: '먹이 루틴',
        body: 'CGD(Repashy) 가루를 물에 개어 3~4일에 한 번 제공. 곤충 간식은 주 1회 이하.',
      },
      {
        title: '건강 체크',
        body: '꼬리 자절 가능성 주의(스트레스 시), 발가락 탈피 잔존물 확인.',
      },
    ],
    references: [
      { label: 'Pangea Reptile - Crested Gecko Care', url: 'https://www.pangeareptile.com' },
    ],
  },
  {
    id: 'cg-ball-python',
    speciesId: 'sp-ball-python',
    sections: [
      {
        title: '사육장 셋업',
        body: '90×45×45cm 이상, 핫사이드 32℃ / 쿨사이드 24℃. 은신처는 양쪽에 모두 배치. 습도 50~60%, 탈피 시 70%까지 상승.',
      },
      {
        title: '먹이 루틴',
        body: '7~10일 간격으로 마우스/래트. 크기는 뱀 가장 두꺼운 부위 ±10%. 거식 시 환경 점검 우선.',
      },
      {
        title: '핸들링',
        body: '식사 후 48시간 핸들링 금지. 주 2~3회, 회당 15분 이하 권장.',
      },
    ],
    references: [{ label: 'Morph Market - Ball Python Care', url: 'https://www.morphmarket.com' }],
  },
  {
    id: 'cg-russian-tortoise',
    speciesId: 'sp-russian-tortoise',
    sections: [
      {
        title: '사육장 셋업',
        body: '90×45cm 이상, 바스킹 32~35℃ + UVB 10.0 필수. 흙·코코피트로 굴 파기 환경 조성.',
      },
      {
        title: '먹이 루틴',
        body: '잎채소 위주(민들레, 클로버, 청경채). 과일은 주 1회 소량. 칼슘 더스팅 격주.',
      },
      {
        title: '건강 체크',
        body: '코·눈 분비물(호흡기 감염 신호), 갑 휘어짐(MBD) 체크.',
      },
    ],
    references: [{ label: 'Tortoise Trust', url: 'https://www.tortoisetrust.org' }],
  },
  {
    id: 'cg-mexican-redknee',
    speciesId: 'sp-mexican-redknee',
    sections: [
      {
        title: '사육장 셋업',
        body: '20×20cm 폴리카보네이트 + 5cm 코코피트. 24~28℃, 습도 60~70%. 은신처 1개.',
      },
      {
        title: '먹이 루틴',
        body: '주 1회 귀뚜라미. 탈피 전후 1~2주는 급여 중단. 신선한 물 항상.',
      },
      {
        title: '주의',
        body: '복부 헤어(자극모) 발사 가능성 — 핸들링 자제, 얼굴 근처 접근 금지.',
      },
    ],
    references: [{ label: 'Arachnoboards', url: 'https://arachnoboards.com' }],
  },
  {
    id: 'cg-emperor-scorpion',
    speciesId: 'sp-emperor-scorpion',
    sections: [
      {
        title: '사육장 셋업',
        body: '30×20cm + 코코피트 10cm 이상(굴 파기). 26~30℃ / 습도 70~80%. 은신처 + 얕은 물 그릇.',
      },
      {
        title: '먹이 루틴',
        body: '주 1~2회 귀뚜라미·둠비아. 어린 개체는 좀 더 자주.',
      },
      {
        title: '주의',
        body: '독성 약하지만 알레르기 가능. 임산부·면역 저하자는 핸들링 자제.',
      },
    ],
    references: [{ label: 'BugzUK - Emperor Scorpion Care', url: 'https://www.bugzuk.com' }],
  },
  {
    id: 'cg-cockatiel',
    speciesId: 'sp-cockatiel',
    sections: [
      {
        title: '케이지 셋업',
        body: '60×40×60cm 이상 가로형 새장 + 자유 비행 시간 매일 2시간 이상. 횃대 다양한 굵기.',
      },
      {
        title: '먹이 루틴',
        body: '시드믹스 + 펠릿 + 잎채소/과일. 아보카도·초콜릿·카페인 금지.',
      },
      {
        title: '건강 체크',
        body: '깃털 윤기·변 상태·체중 주 1회 기록. PBFD 등 바이러스 정기 검진.',
      },
    ],
    references: [{ label: 'BirdSupplies - Cockatiel Care', url: 'https://www.birdsupplies.com' }],
  },
  {
    id: 'cg-axolotl',
    speciesId: 'sp-axolotl',
    sections: [
      {
        title: '수조 셋업',
        body: '60L 이상, 수온 16~18℃ 유지(여름 쿨러 필수). pH 7~8, GH 7~14. 바닥재는 입자 1mm 이하 모래 또는 베어바텀.',
      },
      {
        title: '먹이 루틴',
        body: '아홀로틀 펠릿, 냉동 블러드웜, 갯지렁이. 성체는 격일 1회.',
      },
      {
        title: '건강 체크',
        body: '아가미 외엽 상태·꼬리 곰팡이·식욕 점검. 수질 주 1회 측정.',
      },
    ],
    references: [{ label: 'Caudata.org - Axolotl Care', url: 'https://www.caudata.org' }],
  },
  {
    id: 'cg-sugar-glider',
    speciesId: 'sp-sugar-glider',
    sections: [
      {
        title: '케이지 셋업',
        body: '수직형 90×60×180cm 이상, 둥지박스 + 다수의 가지·로프. 2마리 이상 합사 필수.',
      },
      {
        title: '먹이 루틴',
        body: 'TPG 또는 HPW 식단(채소 + 단백질 + 과일 비율). 사료만 급여 금지.',
      },
      {
        title: '건강 체크',
        body: '비만·자해(스트레스) 신호 모니터링. 정기 구강 검진.',
      },
    ],
    references: [
      { label: 'GliderCentral - Sugar Glider Diets', url: 'https://www.glidercentral.net' },
    ],
  },
  {
    id: 'cg-hedgehog',
    speciesId: 'sp-hedgehog',
    sections: [
      {
        title: '케이지 셋업',
        body: '80×50cm 이상 가로형 + 단단한 휠(상해 방지 메탈 금지). 실내 24~28℃ 유지.',
      },
      {
        title: '먹이 루틴',
        body: '고단백 고양이 사료(저지방), 곤충 간식 주 2~3회. 우유·견과류 금지.',
      },
      {
        title: '건강 체크',
        body: 'WHS(휠링 신드롬) 신호 모니터링, 발톱 정기 관리.',
      },
    ],
    references: [{ label: 'Hedgehog Welfare Society', url: 'https://www.hedgehogwelfare.org' }],
  },
]
