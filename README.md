# Pettography

> 희귀 애완동물(파충류·절지류·희귀 조류·양서류·소형 포유류)을 위한 라이프사이클 포탈.  
> **처음 선택 → 입양 → 사육 → 의료 → 일상 → 노령기 → 장례**까지 단일 앱에서 안내합니다.  
> 위치 기반(서울 송파구 기본)으로 특수동물 병원·먹이/용품 샵·커뮤니티·장례 서비스를 큐레이션합니다.

## 핵심 가치

- **"처음 선택" 강조 온보딩** — 카테고리(파충류/절지류/조류/양서류/소형 포유류) → 종 → 위치 4단계로 모든 큐레이션이 자동 셋업.
- **라이프사이클 전체 커버** — 입양/분양·사육 가이드·특수동물 병원·먹이·노령 관리·정부 등록 장묘업체.
- **위치 기반 추천** — 송파/강남 좌표 mock으로 거리순 정렬, 카카오맵 API 키 등록 시 실지도 연동 자리 확보.
- **외부 링크 큐레이션** — 입점 업체가 부족한 도메인은 농림축산검역본부·서울대 수의과 동물병원·디시인사이드·페트나라 등 검증된 외부 링크로 보강.

## 디렉토리 구조

```
pettography/
├── src/                 # 프론트엔드 (React 19 + Vite + TypeScript)
│   ├── app/             # AppProviders, QueryClient factory
│   ├── components/      # 공용 UI + 레이아웃 (보일러플레이트)
│   ├── features/
│   │   ├── species/         # 종 카탈로그 (10종, 카테고리·난이도·tag)
│   │   ├── onboarding/      # zustand persist 기반 온보딩 store
│   │   ├── location/        # 송파구 좌표 preset, haversine 거리
│   │   ├── hospitals/       # 특수동물 병원 + 거리 정렬
│   │   ├── shops/           # 먹이·용품 샵 (offline + online)
│   │   ├── care-guides/     # 종별 사육 체크리스트·참고자료
│   │   ├── communities/     # 카페·디스코드·유튜브
│   │   ├── adoption/        # 입양·분양·브리더·구조 단체
│   │   ├── funeral/         # 정부 등록 화장장·메모리얼
│   │   └── external-links/  # 한국 펫 사이트 32개 큐레이션 (general/희귀종)
│   ├── pages/
│   │   ├── Landing/ Onboarding/ Dashboard/
│   │   ├── Hospitals/ Shops/ CareGuide/ Communities/
│   │   ├── Adoption/ Funeral/ SpeciesDetail/ NotFound/
│   ├── router/ services/ store/ i18n/ hooks/ utils/
│   └── ...
├── backend/             # NestJS 11 API (독립 패키지)
│   ├── src/
│   │   ├── species/ hospitals/ shops/ care-guides/ communities/ health/
│   │   ├── common/      # geo (haversine), 공용 타입
│   │   └── data/        # in-memory seed (송파/강남 좌표)
│   └── README.md        # 백엔드 실행/엔드포인트 표
└── docs/ARCHITECTURE.md
```

## 라이프사이클 화면 매핑

| 단계      | 페이지               | 데이터/링크                                      |
| --------- | -------------------- | ------------------------------------------------ |
| 처음 선택 | `/onboarding`        | `features/onboarding` + `features/species`       |
| 입양·분양 | `/adoption`          | 정부 시스템, 동물자유연대, 카라, 브리더 외부링크 |
| 사육      | `/care`, `/care/:id` | 종별 체크리스트 + 참고 자료                      |
| 의료      | `/hospitals`         | 송파/강남 특수동물 병원, 거리·24h 응급 배지      |
| 일상      | `/shops`             | 오프라인·온라인 샵, 먹이/용품 필터               |
| 노령기    | `/care` (재방문)     | 사육 가이드 + 노령 체크 항목                     |
| 장례·추모 | `/funeral`           | 21그램·펫포레스트·정부 디렉토리                  |
| 커뮤니티  | `/communities`       | 네이버 카페·디스코드·유튜브                      |

## 기술 스택

### Frontend (루트)

- **React 19** + **Vite** + **TypeScript** strict + **pnpm**
- **TanStack Query 5** — 서버 상태 (species/hospitals/shops/care/communities/adoption/funeral)
- **Zustand 5** (`persist` middleware) — onboarding profile localStorage 저장
- **React Router 7** Data Router + route-level `lazy` (코드 스플리팅)
- **Zod** 스키마 + **ky** HTTP client
- **i18next** ko/en 키 동기화 (`pnpm test:i18n`)
- **CSS Modules** + 디자인 토큰 (보일러플레이트 유지)

### Backend (`backend/`)

- **NestJS 11** + Node 22 + 자체 lockfile
- Modules: `Species`·`Hospitals`·`Shops`·`CareGuides`·`Communities`·`Health`
- `ValidationPipe` 전역, CORS `http://localhost:5173`, prefix `/api`
- in-memory seed (송파/강남 좌표, 11종/7병원/9샵/11가이드/10커뮤니티)
- haversine 거리 계산, 좌표 + radiusKm 필터

## 실행 방법

### 0. 사전 요구

- Node.js ≥ 22
- pnpm ≥ 10

### 1. 프론트엔드 단독 (mock 데이터로 동작)

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

`features/*/api.ts`는 환경변수 `VITE_API_URL`이 없으면 in-memory mock data를 반환합니다.

### 2. NestJS 백엔드까지 함께 실행

```bash
# 터미널 1
cd backend
pnpm install
pnpm dev          # http://localhost:3001/api/health

# 터미널 2 (루트)
VITE_API_URL=http://localhost:3001/api pnpm dev
```

### 3. 품질 게이트

```bash
pnpm verify       # format:check + lint + typecheck + test + build
pnpm verify:push  # verify + security audit
```

pre-commit hook은 staged 파일만 lint/format, pre-push hook은 `pnpm verify:push` 전체 게이트를 실행합니다.

## 환경변수

| 변수           | 기본값 | 설명                                              |
| -------------- | ------ | ------------------------------------------------- |
| `VITE_API_URL` | (없음) | 설정 시 NestJS API 호출. 미설정 시 mock fallback. |

카카오맵 SDK 키를 도입한다면 `VITE_KAKAO_MAP_KEY`를 추가하고 `pages/Hospitals`의 `mapPlaceholder`를 실제 지도로 교체하면 됩니다 (placeholder는 의도적으로 남겨둠).

## 데이터 출처

- 종 사육 정보: 국립생물자원관, Reptiles Magazine, Pangea Reptile, BugzUK 등 외부 참고 (요약·재구성)
- 병원/샵 좌표: 송파/강남 인근 mock (실제 운영 데이터 아님)
- 외부 링크: WebSearch + WebFetch로 검증한 한국 실제 사이트 32개 (`features/external-links/mockData.ts`)

## 한계 및 후속 작업

- 카카오맵 SDK 미연동 (placeholder만 표시)
- 펫보험·노령기 전용 가이드 데이터는 아직 비어있음 (외부링크 큐레이션 단계에서 시장 공백 확인됨)
- 24시간 특수동물 응급 병원 신뢰 디렉토리 부재 — 추후 보강 필요
- 양서류 전용 한국 쇼핑몰 빈자리 (`external-links` 큐레이션 메모 참조)
