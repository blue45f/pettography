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
- **i18n ko/en/ja** 완전 동기화 — 3개 언어 키 패리티 (`pnpm test:i18n` 게이트), 헤더 언어 선택기.

## 페이지 맵 (총 60개 라우트)

| 카테고리  | 페이지                                                                       | 설명                                                                                                                                                                            |
| --------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 진입      | `/`, `/onboarding`                                                           | 랜딩(emoji orb hero) + 4단계 첫 선택 (regulated 카테고리 안내, 펫 nickname)                                                                                                     |
| 메인      | `/dashboard`                                                                 | 위치 chip, 종 카드, lifecycle rail, **이번 주 활동 strip**, **오늘의 컨디션 위젯**(health/habitat/budget/supplies), **다가오는 일정 preview**(D-3 toast + browser notification) |
| 종        | `/species`, `/species/:slug`, `/compare`, `/morphs`                          | 카탈로그(필터+검색+비교 cart) / 상세(병원·샵·갤러리·관련종+filingStatus 배지) / 최대 3종 비교(URL deep-link) / 모프 카탈로그 + KR 가격대                                        |
| 매칭      | `/match`                                                                     | 8문항 quiz → 추천 3종 + 비교 deep-link + regulated 배지                                                                                                                         |
| 위치      | `/hospitals`, `/shops`                                                       | 카카오맵 + 거리순 + 24h 응급 배지 (13개 병원, 14개 샵)                                                                                                                          |
| 가이드    | `/care`, `/care/:speciesId`, `/communities`, `/resources`, `/setup`, `/food` | 사육 가이드 / 커뮤니티 / 32개 외부 자료 / 카테고리별 셋업 견적 / 먹이 단가·영양                                                                                                 |
| 일상      | `/diary`, `/routine`, `/calendar`                                            | 일지(사진 URL 첨부) / 카테고리별 routine 체크 / health+supplies+registry 통합 timeline                                                                                          |
| 의료/환경 | `/health`, `/habitat`, `/budget`, `/supplies`, `/sos`, `/insurance`          | 체중·접종 / 온습도 시계열 / 월 지출 / 사료 재고 / 응급 SOS 1-tap (+모바일 floating SOS) / 펫보험·비상금                                                                         |
| 입양/장례 | `/adoption`, `/funeral`                                                      | 검증된 외부 채널 + 정부 등록 장묘업체                                                                                                                                           |
| 커뮤니티  | `/consult`, `/forum`                                                         | 수의사 실시간 상담(socket.io) / 종별 게시판                                                                                                                                     |
| 입점/운영 | `/partners`, `/partner-dashboard`, `/admin`                                  | 입점 신청 / 승인된 가게 관리 / 어드민                                                                                                                                           |
| 행사      | `/events`                                                                    | 2026 한국 펫 박람회 8건 timeline (지역 필터)                                                                                                                                    |
| 법규/안전 | `/registry`, `/petid`, `/backup`                                             | 2025-12-14 야생생물법 4종 신고 체크리스트 / 인쇄용 미아 ID 카드 / 데이터 export·import·wipe                                                                                     |
| 메타      | `/about`, `/faq`                                                             | 앱 소개·원칙·데이터 출처 / 10개 자주 묻는 질문 accordion                                                                                                                        |

### 🆕 v0.2 확장 (22개 신규 라우트, ko/en/ja)

| 카테고리          | 페이지                                     | 설명                                                                                                                                 |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| 🧬 유전/번식      | `/genetics`, `/breeding`                   | 모프 유전 **펀넷 계산기**(het 확률·공우성 슈퍼·6종 trait) / 페어링·클러치·**부화 카운트다운**(종별 온도·TDSD) + 유전 계산 연동       |
| 🦎 사육 도구      | `/molt`, `/vivarium`, `/feeding`, `/meds`  | 탈피·털갈이 **주기 예측** / **바이오액티브 비바리움** 설계(단면도·클린업크루) / **급이 스케줄러+먹이 크기 계산** / 투약·격리 추적    |
| 👥 커뮤니티+      | `/showcase`, `/qna`, `/meetups`, `/market` | 월간 **포토 콘테스트**+투표 / 종별 **Q&A**(채택·투표) / **키퍼 밋업**·멘토 매칭 / CB **분양 마켓**(무료 나눔·규제종 신고 경고)       |
| 🪪 통합/케어      | `/passport`, `/assistant`                  | **펫 여권**+업적(게임화, 전 기능 데이터 집계) / 규칙 기반 **증상 triage**(응급 → /sos·/hospitals)                                    |
| 📈 정밀 케어      | `/growth`, `/water`, `/brumation`, `/gear` | **성장 곡선**(종 표준 밴드) / **수질**(질소 순환·NH3/NO2/NO3) / **동면 플래너**(6단계 일정) / **장비 수명**(UVB 교체 D-day)          |
| 🌗 생애·건강·안전 | `/senior`, `/vitals`, `/cohab`             | **노령기 케어**(수명 대비 생애 단계·체크리스트) / **바이탈**(호흡·심박 탭 카운터) / **합사 체커**(규칙 기반 단독사육 안내)           |
| 🧭 계획·복지·대비 | `/wishlist`, `/taming`, `/kit`             | **위시리스트**(입양 준비도 체크) / **핸들링 적응**(세션·스트레스 추이·내성 가이드) / **응급 키트**(대비 체크리스트·연락처·/sos 연동) |

> 모든 신규 기능: pet-scoped zustand persist · 디자인 토큰 준수 · 라이트/다크 동등 · WCAG AA · ko/en/ja i18n 키 패리티 · 단위 테스트.

## 디렉토리 구조

```
pettography/
├── src/                 # Frontend (React 19 + Vite + TS strict)
│   ├── features/        # 30+ features (species, onboarding, genetics, molt, vivarium, breeding, feeding, meds, showcase, qna, meetups, market, passport, assistant ...)
│   ├── pages/           # 60 routes (lazy)
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
- i18next ko/en/ja + Pretendard fluid typography (clamp)
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

### 4. PR 머지 게이트 (CI + CodeRabbit)

main 머지는 모든 GitHub Actions status check가 통과해야만 가능합니다:

- `Frontend verify` (`pnpm verify`)
- `Backend verify` (`backend/pnpm verify`)
- `CodeRabbit review` — `.coderabbit.yaml`이 활성화되어 있어 PR이 열리면 [CodeRabbit](https://www.coderabbit.ai/) GitHub App이 자동 리뷰를 시작합니다. 이 job은 CodeRabbit이 head SHA에 대해 PR review를 남길 때까지 최대 20분 대기하며, `CHANGES_REQUESTED`이면 실패합니다.

#### 1회 GitHub UI 설정 (관리자)

위 status check를 실제 머지 차단으로 만들려면 한 번만 Repository 설정을 수정해야 합니다.

1. `Settings` → `Branches` → `Branch protection rules` → `Add rule`.
2. Branch name pattern: `main`.
3. `Require a pull request before merging` 체크.
4. `Require status checks to pass before merging` + `Require branches to be up to date before merging` 체크.
5. Required status checks: `Frontend verify`, `Backend verify`, `CodeRabbit review` 세 가지 모두 선택.
6. `Do not allow bypassing the above settings` (admin도 게이트 강제).

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
