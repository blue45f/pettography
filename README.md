# Pettography

> 희귀 애완동물(파충류·절지류·희귀 조류·양서류·소형 포유류) 라이프사이클 포탈.
> **처음 선택 → 입양 → 사육 → 의료 → 일상 → 노령기 → 장례·추모** + 한국 2025-12-14 야생생물법 보관신고 가이드까지 단일 앱.
> 위치 기반(서울 송파구 기본)으로 특수동물 병원·먹이/용품 샵·커뮤니티·장례 서비스를 큐레이션합니다.

## 핵심 가치

- **"처음 선택" 강조 온보딩** — 카테고리(파충류/절지류/조류/양서류/소형 포유류) → 종 → 위치 → 검토 4단계. 규제 카테고리 선택 시 [야생생물법 보관신고 안내] 카드 자동 노출.
- **라이프사이클 전체 커버** — 입양/분양·사육 가이드·특수동물 병원·먹이·노령 관리·정부 등록 장묘업체.
- **위치 기반 추천** — 송파/강남 좌표 mock으로 거리순 정렬, 카카오맵 API 키 등록 시 실지도 연동.
- **외부 링크 큐레이션** — 입점 업체가 부족한 도메인은 환경부·농림축산검역본부·동물자유연대·카라·디시인사이드 등 32개 외부 링크.
- **사용자 데이터 100% 클라이언트 저장** — zustand persist + localStorage. `/backup` 페이지에서 JSON export/import.
- **i18n ko/en** 완전 동기화 (`pnpm test:i18n` 게이트).

## 페이지 맵 (총 33개 라우트)

| 카테고리  | 페이지                                                    | 설명                                                                                                                                  |
| --------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 진입      | `/`, `/onboarding`                                        | 랜딩 + 4단계 첫 선택 (regulated 카테고리 안내 자동)                                                                                   |
| 메인      | `/dashboard`                                              | 위치 chip, 종 카드, lifecycle rail, **오늘의 컨디션 위젯**(health/habitat/budget/supplies), **다가오는 일정 preview**(D-3 toast 알림) |
| 종        | `/species`, `/species/:slug`, `/compare`                  | 카탈로그(필터+검색+카드 내 + 비교 cart) / 상세(병원·샵·갤러리·관련종) / 최대 3종 비교 (URL deep-link)                                 |
| 매칭      | `/match`                                                  | 8문항 quiz → 추천 3종 + 비교 deep-link                                                                                                |
| 위치      | `/hospitals`, `/shops`                                    | 카카오맵 + 거리순 + 24h 응급 배지                                                                                                     |
| 가이드    | `/care`, `/care/:speciesId`, `/communities`, `/resources` | 사육 가이드 / 외부 커뮤니티 / 32개 외부 자료                                                                                          |
| 일상      | `/diary`, `/routine`, `/calendar`                         | 일지(사진 URL 첨부) / 카테고리별 routine 체크 / health+supplies+registry 통합 timeline                                                |
| 의료/환경 | `/health`, `/habitat`, `/budget`, `/supplies`, `/sos`     | 체중·접종 / 온습도 시계열 / 월 지출 / 사료 재고 / 응급 SOS 1-tap                                                                      |
| 입양/장례 | `/adoption`, `/funeral`                                   | 검증된 외부 채널 + 정부 등록 장묘업체                                                                                                 |
| 커뮤니티  | `/consult`, `/forum`                                      | 수의사 실시간 상담(socket.io) / 종별 게시판                                                                                           |
| 입점/운영 | `/partners`, `/partner-dashboard`, `/admin`               | 입점 신청 / 승인된 가게 관리 / 어드민                                                                                                 |
| 법규/안전 | `/registry`, `/petid`, `/backup`                          | 2025-12-14 야생생물법 4종 신고 체크리스트 / 인쇄용 미아 ID 카드 / 데이터 export·import·wipe                                           |

## 디렉토리 구조

```
pettography/
├── src/                 # Frontend (React 19 + Vite + TS strict)
│   ├── features/        # 18 features (species, onboarding, gallery, registry, routine, petid, backup ...)
│   ├── pages/           # 33 routes (lazy)
│   ├── components/      # shared UI (Card, Badge, Button, Input, Textarea, Toast, BottomNav, Header ...)
│   ├── router/ store/ services/ i18n/ hooks/ utils/
│   └── assets/styles/   # design tokens (OKLCH-tinted, fluid clamp)
├── backend/             # NestJS 11 API
│   └── src/             # species, hospitals, shops, care-guides, communities, adoption, funeral,
│                        # forum, partners, consult (WS gateway), registry, compare, health
└── docs/                # PRODUCT.md / DESIGN.md (impeccable skill)
```

## 기술 스택

### Frontend

- React 19 + Vite + TypeScript strict + pnpm + React Compiler preset
- TanStack Query 5 + Zustand 5(persist) + React Router 7 Data Router
- Zod + react-hook-form + ky
- i18next ko/en + Pretendard fluid typography (clamp)
- CSS Modules + container queries + safe-area-inset + dvh
- 모바일: BottomNav(≤860px) + 가로 스크롤 lifecycle/vet rail

### Backend

- NestJS 11 + Node 22 + class-validator
- Modules: species·hospitals·shops·care-guides·communities·adoption·funeral·forum·partners·consult(WS)·registry·compare·health
- ValidationPipe 전역, CORS `http://localhost:5173`, prefix `/api`
- in-memory seed (송파/강남, 16종, 응급 24h 배지 등)

## 실행 방법

### 0. 사전 요구

- Node.js ≥ 22, pnpm ≥ 10

### 1. 프론트엔드 단독 (mock fallback)

```bash
pnpm install
pnpm dev          # http://localhost:5173 (자동 다음 포트로 fallback)
```

`features/*/api.ts`는 `VITE_API_URL` 미설정 시 in-memory mock을 반환합니다.

### 2. NestJS 백엔드와 함께

```bash
# 터미널 1
cd backend && pnpm install && pnpm dev   # http://localhost:3001/api

# 터미널 2 (루트)
VITE_API_URL=http://localhost:3001/api pnpm dev
```

`/consult` WebSocket namespace는 socket.io 클라이언트에서 `http://localhost:3001/consult`로 연결합니다.

### 3. 품질 게이트

```bash
pnpm verify        # format:check + lint + typecheck + test + build
pnpm test:i18n     # ko/en 키 parity (별도 vitest)
pnpm verify:push   # verify + lint:security + audit (pre-push hook과 동일)
```

pre-commit: staged 파일만 lint/format. pre-push: `verify:push` 전체.

## 환경변수

| 변수                 | 기본값 | 설명                                              |
| -------------------- | ------ | ------------------------------------------------- |
| `VITE_API_URL`       | (없음) | 설정 시 NestJS API 호출. 미설정 시 mock fallback. |
| `VITE_KAKAO_MAP_KEY` | (없음) | 카카오맵 SDK 키. 미설정 시 placeholder.           |

## 데이터 출처

- 종 사육 정보: 국립생물자원관, Reptiles Magazine, MorphMarket, Pangea Reptile, BugzUK 등 외부 참고를 요약·재구성.
- 병원/샵 좌표: 송파/강남 인근 mock (실제 운영 데이터 아님; 정부 등록 여부 배지로 표기).
- 외부 링크: WebSearch + WebFetch로 검증한 한국 실제 사이트 32개 (`features/external-links/mockData.ts`).
- 야생생물법 신고 가이드: 환경부 공식 안내 (wildlife.go.kr, animal.go.kr) 요약. 법적 효력은 공식 자료가 최종 기준.

## 한계 및 후속 작업

- 카카오맵 SDK 미연동 (placeholder만 표시).
- 백색목록 종 분류는 추정치 — 환경부 공식 백색목록 발표에 따라 갱신 필요.
- 펫보험·노령기 전용 가이드 데이터는 아직 비어있음.
- 24시간 특수동물 응급 병원 신뢰 디렉토리 부재 — 추후 보강 필요.
- Multi-pet (한 사용자 다중 펫) 미지원 — 현재는 단일 펫 가정.
- 백엔드 health/habitat/budget/supplies REST는 frontend zustand에 머무름 — multi-device sync 필요 시 backend 확장.
