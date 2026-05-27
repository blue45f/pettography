# Contributing

## 개발 환경

프론트엔드와 backend는 각각 독립 pnpm lockfile을 사용합니다.

```bash
pnpm install
pnpm run dev

cd backend
pnpm install
pnpm run dev
```

## 작업 흐름

1. 프론트 UI/API client 변경과 backend API 변경의 계약을 함께 확인합니다.
2. 공통 도메인 규칙은 문서와 테스트에 반영합니다.
3. backend 변경은 `backend/package.json`의 `verify` 기준을 통과해야 합니다.
4. PR 전에는 루트와 backend 검증을 모두 확인합니다.

## 품질 기준

| 명령                            | 목적                                         |
| ------------------------------- | -------------------------------------------- |
| `pnpm run verify`               | 프론트 format, lint, typecheck, test, build  |
| `pnpm run verify:push`          | 프론트 verify + 보안 lint                    |
| `cd backend && pnpm run verify` | backend format, lint, typecheck, test, build |

## 코드 스타일

프론트는 React/Vite 계층을 `src/app`, `src/components`, `src/features`, `src/services` 중심으로 유지합니다. backend는 NestJS module/controller/service 경계를 유지하고 DTO validation을 우선합니다.
