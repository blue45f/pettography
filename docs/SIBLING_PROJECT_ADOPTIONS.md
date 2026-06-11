# 형제 프로젝트 반영 로그

생성일: 2026-06-08

`/Users/hjunkim/WebstormProjects` 아래 형제 프로젝트를 현재 `pettography` 기준으로 비교한 반영 로그입니다. 목적은 단순한 라이브러리 추가가 아니라, 현재 제품의 도메인과 운영 구조에 맞는 아키텍처/기능/코드 패턴을 선별해 반영하는 것입니다.

## 이번 반영

| 출처 프로젝트                     | 반영 항목                                                                           | Pettography 반영 위치                                                                      | 검증                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| PromptMarket, offhours, termsdesk | Nest API 공통 하드닝: `helmet`, `compression`, `@nestjs/throttler`, Swagger/OpenAPI | `backend/src/common/http-hardening.ts`, `backend/src/main.ts`, `backend/src/app.module.ts` | `pnpm --filter pettography-backend run typecheck`, `pnpm --filter pettography-backend run test` |
| PromptMarket                      | 등록 폼 draft 자동 저장 + live preview 패턴                                         | `src/pages/Market/Market.tsx`, `src/pages/Market/Market.module.css`                        | `pnpm run test:run src/pages/Market/Market.test.tsx src/i18n/locales.test.ts`                   |
| termsdesk, spa-seo-gateway        | canonical SHA-256 hash 감사 패턴을 Backup export/import 무결성 checksum으로 반영    | `src/pages/Backup/backupEnvelope.ts`, `src/pages/Backup/Backup.tsx`                        | `pnpm run test:run src/pages/Backup/Backup.test.tsx src/i18n/locales.test.ts`                   |
| multi-environment-setting         | 환경별 설정 검증 패턴을 Vite/Nest env 계약 검증 게이트로 축소 반영                  | `scripts/validate-env.mjs`, `.env.example`, `package.json`                                 | `pnpm run test:env`, `pnpm run validate:env`                                                    |
| rotifolk, offhours                | public API contract 테스트 패턴                                                     | `src/features/api-contracts.test.ts`                                                       | `pnpm run test:run src/features/api-contracts.test.ts`                                          |
| resume                            | MSW 원격 API 테스트 패턴을 fetch-stub 기반 remote mode 테스트로 경량 반영           | `src/features/remote-api-mode.test.ts`                                                     | `pnpm run test:run src/features/remote-api-mode.test.ts`                                        |

## 프로젝트별 비교 결과

| 형제 프로젝트               | 확인한 강점                                                                                                                   | 현재 반영 상태                                                                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PromptMarket`              | monorepo shared schema, Nest hardening, Swagger, Throttler, 등록 폼 draft/live preview, React Hook Form + zod, Storybook/a11y | API 하드닝과 마켓 draft/live preview 반영. RHF/zod/Storybook/a11y는 기존 보유.                                                                                                               |
| `family-care-platform`      | 단순한 web/api/shared 경계, No-FOUC 테마, schema 중심 shared package                                                          | `pettography`는 이미 workspace shared package, No-FOUC 테마 bootstrap, i18n/route 구조 보유. 추가 반영 없음.                                                                                 |
| `multi-environment-setting` | Next 기반 환경 설정 검증, Playwright 사용                                                                                     | Next 전환은 부적합하므로 Vite/Nest env 계약 검증 게이트로 축소 반영. Playwright infra는 현재 범위에서는 보류.                                                                                |
| `offhours`                  | Nest hardening, Swagger, Throttler, cookie/helmet/compression, a11y/API contract scripts, 결제/예약 도메인                    | API 하드닝과 public API contract 테스트 반영. 결제/예약 라이브러리는 현재 도메인과 직접 무관.                                                                                                |
| `proto-live`                | 데모 계정/테스트 시드, HMAC 세션 서명, 제안/매치 운영 데이터                                                                  | 인증/세션 도메인이 없으므로 HMAC 세션은 보류. 테스트 시드 운영 패턴은 추후 백엔드 확장 후보.                                                                                                 |
| `remote-devtools`           | Sentry, Terminus, Swagger, Throttler, rrweb/replay, SDK 분리, 대형 운영 도구 UI                                               | Swagger/Throttler 계열은 반영. `/health`는 이미 보유. Sentry/Prometheus 계열은 외부 DSN/metrics stack 확정 전까지 보류. rrweb/SDK는 도메인 부적합.                                           |
| `resume`                    | 전역 `react-error-boundary`, PWA, Sentry, multi-LLM fallback, rich editor, PDF/DOCX 처리, MSW                                 | `pettography`는 ErrorBoundary, PWA SW, i18n, skeleton을 이미 보유. MSW 패턴은 fetch-stub remote mode 테스트로 경량 반영. Sentry는 운영 관측성 후보. multi-LLM/문서 처리 라이브러리는 부적합. |
| `rotifolk`                  | ICS export, frontend a11y audit, API contract tests, socket/Nest patterns                                                     | `pettography`는 ICS 유틸, a11y audit, WebSocket consult를 이미 보유. API contract 테스트 반영.                                                                                               |
| `spa-seo-gateway`           | SPA SEO gateway, Prometheus metrics, cache/tenant/admin, SHA/hash audit patterns                                              | per-page OG/meta와 PWA는 이미 보유. SHA/hash 패턴은 Backup checksum으로 반영. Prometheus/metrics는 metrics backend 부재로 보류. gateway 자체는 부적합.                                       |
| `termsdesk`                 | legal/version hash chain, Nest hardening, Swagger/Throttler, typed SDK, branded confirm/toast 금지 규칙                       | API 하드닝과 Backup checksum 반영. typed SDK는 현재 단일 앱 구조에서는 보류.                                                                                                                 |
| `webtoon-index`             | cmdk/lucide/motion/Three.js, dynamic OG rewrite, route manifest, genre spectrum UI                                            | `pettography`는 CommandPalette, route lazy, per-page meta를 이미 보유. 3D/VRM/canvas 계열은 도메인 대비 비용이 높아 보류.                                                                    |

## 이미 보유한 크로스 프로젝트 기능

- Dynamic per-page meta: `src/hooks/usePageMeta.ts`
- PWA service worker: `src/main.tsx`, `public/sw.js`, `public/manifest.webmanifest`
- 전역/라우트 에러 처리: `src/components/common/ErrorBoundary`, `src/components/common/RouteError`, `src/router/index.tsx`
- 쿼리 연결 skeleton: 주요 API pages와 `src/components/common/Skeleton`
- Command palette: `src/components/layout/CommandPalette`, `src/config/toolCatalog.ts`
- i18n key parity test: `src/i18n/locales.test.ts`
- ICS export: `src/utils/ics.ts`
- a11y audit script: `scripts/audit-frontend-a11y.mjs`

## 보류/미도입 사유

1. `remote-devtools`/`resume`의 Sentry 프론트 오류 수집은 DSN/운영 계정/개인정보 마스킹 정책이 확정된 뒤 도입하는 편이 안전합니다.
2. `remote-devtools`/`spa-seo-gateway`의 Prometheus/metrics stack은 현재 배포 구조에 metrics backend가 없어 라이브러리만 추가하면 운영 가치가 낮습니다.
3. `proto-live`의 HMAC 세션 서명은 현재 인증/세션 도메인이 없어 적용하지 않았습니다.
4. `webtoon-index`의 3D/VRM/canvas 계열은 희귀동물 케어 포털의 핵심 사용 흐름 대비 비용이 높아 제외했습니다.
