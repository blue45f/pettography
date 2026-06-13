# Contributing

## 개발 환경

프론트엔드와 backend는 단일 pnpm workspace(`pnpm-workspace.yaml`의 `.`, `backend`)이며 루트 lockfile 하나를 공유합니다. 루트에서 `pnpm install` 한 번이면 양쪽 의존성이 모두 설치됩니다.

```bash
pnpm install            # 프론트 + backend 의존성 일괄 설치
pnpm run dev            # 프론트 dev 서버
pnpm run dev:backend    # backend dev 서버 (--filter pettography-backend)
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

## PR 규칙

- PR 템플릿의 체크리스트를 PR 전 모두 완료하고, 프론트엔드/백엔드 검증 로그를 PR 본문에 남깁니다.
- PR 본문에는 변경 요약, 영향 범위, 회귀 대응/롤백 포인트를 기록합니다.
- 병합 전 `CodeRabbit review gate`가 `APPROVED` 상태여야 하며, 동일 PR에서 `skipped` 항목이 있으면 병합 대기합니다.
- API 계약 또는 마이그레이션 변경은 영향 경로와 호환성 점검을 별도 체크리스트에 남깁니다.

## 코드 스타일

프론트는 React/Vite 계층을 `src/app`, `src/components`, `src/domains`, `src/infrastructure` 중심으로 유지합니다. backend는 NestJS module/controller/service 경계를 유지하고 DTO validation을 우선합니다.
