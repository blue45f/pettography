# Pettography 배포 가이드 (Deployment)

이 문서는 pettography의 **두 티어 전체** 배포를 다룹니다. 저장소의 실제 워크플로/설정을 기준으로 작성되었으며, 임의의 provider를 가정하지 않습니다.

## 1. 아키텍처 (어느 티어가 어디로 가는가)

| 티어         | 스택                                       | 호스트              | 빌드 산출물                     | CI 워크플로                            |
| ------------ | ------------------------------------------ | ------------------- | ------------------------------- | -------------------------------------- |
| **Frontend** | Vite + React 19 SPA                        | **Vercel**          | `dist/` 정적 번들               | `.github/workflows/deploy-vercel.yml`  |
| **Backend**  | NestJS 11 (Express) + socket.io 게이트웨이 | **Render** (Docker) | `backend/dist/main.js` 컨테이너 | `.github/workflows/deploy-backend.yml` |

- 프론트엔드는 정적 SPA입니다. `VITE_API_URL`이 설정되면 NestJS API를 호출하고, 미설정 시 in-memory mock으로 fallback합니다 (`src/features/*/api.ts`).
- 백엔드는 DB/인증이 없는 **상태 비저장 in-memory API**(+ `/consult` WebSocket)입니다 — 컨테이너 호스팅(Render/Fly)에 적합합니다.
- 두 티어는 **독립 배포**됩니다. 프론트엔드는 Vercel CDN, 백엔드는 Render 컨테이너로 나갑니다. 둘을 잇는 것은 `VITE_API_URL`(프론트→백엔드 주소)과 `CORS_ORIGINS`(백엔드가 허용할 프론트 origin) 두 환경변수입니다.

```
[브라우저] --(정적 자산)--> Vercel (frontend, dist/)
     |
     |  fetch(VITE_API_URL)  +  socket.io(/consult)
     v
Render (backend, NestJS 컨테이너, /api/* + /consult)
     ^
     |  CORS_ORIGINS 로 허용된 origin만 통과
```

---

## 2. Frontend 배포 (Vercel)

### 빌드 커맨드

```bash
pnpm install --frozen-lockfile
pnpm run build        # tsc -b && vite build  ->  dist/
```

### CI 동작 (`deploy-vercel.yml`)

- 트리거: `main` 푸시(프론트/백엔드 소스 변경 path) 또는 수동 `workflow_dispatch`.
- **`VERCEL_TOKEN` secret이 없으면 배포 단계 전체를 skip** 합니다 (job은 green). 토큰이 있으면 `vercel deploy --prod --confirm` 으로 프로덕션 배포.

### 필요한 GitHub secret

| Secret         | 용도                                       |
| -------------- | ------------------------------------------ |
| `VERCEL_TOKEN` | Vercel CLI 인증 토큰. 미설정 시 배포 skip. |

### 프론트엔드 환경변수 (Vercel 대시보드 / `vercel env`)

| 변수                 | 예시                                           | 설명                                         |
| -------------------- | ---------------------------------------------- | -------------------------------------------- |
| `VITE_API_URL`       | `https://pettography-backend.onrender.com/api` | 백엔드 API 주소. 미설정 시 mock fallback.    |
| `VITE_KAKAO_MAP_KEY` | `<카카오 JS 키>`                               | 카카오맵 SDK 키. 미설정 시 placeholder 지도. |

> 빌드 타임 변수입니다(`import.meta.env.VITE_*`). 값 변경 후에는 재배포가 필요합니다.

### 수동(대시보드) 단계 — 최초 1회

1. Vercel에 저장소 import → Framework: **Vite**, build command `pnpm run build`, output dir `dist`.
2. `Settings → Environment Variables` 에 `VITE_API_URL`, `VITE_KAKAO_MAP_KEY` 추가 (Production/Preview 구분 권장).
3. Vercel 계정에서 토큰 발급 후 GitHub repo secret `VERCEL_TOKEN` 에 저장 → 이후 CI 자동 배포 활성화.

### Preview vs Production

- **Production**: `main` 푸시 → `vercel deploy --prod`.
- **Preview**: PR/브랜치는 Vercel Git 연동을 켜두면 자동 preview URL이 생성됩니다(대시보드 import 시 기본 활성). preview에는 별도 env scope를 둘 수 있습니다.

---

## 3. Backend 배포 (Render, Docker)

백엔드는 `backend/Dockerfile`(멀티스테이지, **node:22-alpine**, 프로덕션 의존성만, non-root `node` 유저, `node dist/main.js`)로 컨테이너를 빌드합니다. Render Blueprint는 `render.yaml`에 정의되어 있습니다.

### 로컬에서 컨테이너 검증

```bash
# 저장소 루트에서 (lockfile/workspace가 루트에 있으므로 컨텍스트=.)
docker build -f backend/Dockerfile -t pettography-backend .
docker run --rm -p 3001:3001 \
  -e CORS_ORIGINS=http://localhost:5173 \
  pettography-backend
# 확인: curl http://localhost:3001/api/health  ->  {"status":"ok","uptime":...}
```

이미지에는 컨테이너 레벨 `HEALTHCHECK`(`/api/health`)가 포함되어 있습니다.

### `render.yaml` (Blueprint) 요약

- `type: web`, `runtime: docker`, `dockerfilePath: ./backend/Dockerfile`, `dockerContext: .`
- `healthCheckPath: /api/health`
- `autoDeploy: false` — Render git 자동배포 대신 **CI deploy hook**으로만 배포(중복 배포 방지).
- `PORT`는 Render가 주입하며 `main.ts`가 `0.0.0.0:$PORT`로 바인딩합니다.

### CI 동작 (`deploy-backend.yml`)

- 트리거: `main` 푸시(`backend/**`, `render.yaml`, lockfile 등 변경) 또는 수동.
- **`RENDER_DEPLOY_HOOK_URL` secret이 없으면 skip** (deploy-vercel.yml과 동일한 패턴 — job은 green). 있으면 deploy hook URL로 `POST`하여 Render 프로덕션 배포를 트리거.

### 필요한 GitHub secret

| Secret                   | 용도                                                         |
| ------------------------ | ------------------------------------------------------------ |
| `RENDER_DEPLOY_HOOK_URL` | Render 서비스의 Deploy Hook URL. 미설정 시 백엔드 배포 skip. |

### 백엔드 환경변수 (Render 대시보드)

| 변수           | 예시                             | 설명                                                                                               |
| -------------- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| `NODE_ENV`     | `production`                     | `render.yaml`에서 설정됨.                                                                          |
| `PORT`         | (Render 자동 주입)               | 직접 설정 불필요. 로컬 default 3001.                                                               |
| `CORS_ORIGINS` | `https://pettography.vercel.app` | REST + `/consult` 게이트웨이가 허용할 프론트 origin(쉼표 구분). 미설정 시 `http://localhost:5173`. |

> **중요**: 프론트가 Vercel에 떠 있다면 `CORS_ORIGINS`에 그 origin을 반드시 넣어야 브라우저 요청/WebSocket이 통과합니다. 여러 개면 쉼표로: `https://prod.example.com,https://staging.example.com`.

### 수동(대시보드) 단계 — 최초 1회

1. Render → **New → Blueprint** → 이 저장소 선택. Render가 `render.yaml`을 읽어 `pettography-backend` web service를 생성.
2. 생성된 서비스의 `Environment` 에서 `CORS_ORIGINS`를 배포된 Vercel origin으로 설정.
3. 서비스의 `Settings → Deploy Hook` URL을 복사 → GitHub repo secret `RENDER_DEPLOY_HOOK_URL` 에 저장. 이후 `main` 푸시 시 CI가 자동으로 배포 트리거.
4. (선택) Render Git 자동배포를 끄지 않았다면 CI hook과 중복될 수 있으니 `render.yaml`의 `autoDeploy: false`를 유지.

### Preview vs Production

- 기본 구성은 단일 `main` → production 서비스입니다.
- preview가 필요하면 Render의 **PR Preview Environments**를 대시보드에서 켜거나, `render.yaml`에 staging 서비스를 추가하면 됩니다(현재 미구성).

### Fly.io 대안 (선택)

`render.yaml` 대신 Fly를 쓰려면 동일한 `backend/Dockerfile`로 `fly launch --dockerfile backend/Dockerfile` 후 `fly.toml`에 `internal_port`를 `PORT`와 맞추고 `[[http_service]] checks` 를 `/api/health`로 지정하면 됩니다. (현재 저장소에는 `fly.toml`이 없습니다 — Render 경로가 기본입니다.)

---

## 4. 환경변수 / Secret 한눈에 보기

| 위치           | 키                       | 필수?  | 비고                                      |
| -------------- | ------------------------ | ------ | ----------------------------------------- |
| GitHub secrets | `VERCEL_TOKEN`           | 배포시 | 미설정 시 프론트 배포 skip                |
| GitHub secrets | `RENDER_DEPLOY_HOOK_URL` | 배포시 | 미설정 시 백엔드 배포 skip                |
| Vercel env     | `VITE_API_URL`           | 권장   | 미설정 시 mock fallback (UI는 동작)       |
| Vercel env     | `VITE_KAKAO_MAP_KEY`     | 선택   | 미설정 시 지도 placeholder                |
| Render env     | `CORS_ORIGINS`           | 권장   | 프론트 origin. 미설정 시 localhost만 허용 |
| Render env     | `NODE_ENV`               | 자동   | `render.yaml`에서 production              |
| Render env     | `PORT`                   | 자동   | Render 주입                               |

> CI의 배포 step들은 secret이 없으면 **조용히 skip**하도록 설계되어 있습니다. 따라서 실제 배포를 켜려면 위 secret/대시보드 단계가 **수동으로** 선행되어야 합니다.

---

## 5. 배포 순서 체크리스트

1. 백엔드 먼저 Render Blueprint로 띄우고 공개 URL 확보 (`https://...onrender.com`).
2. 그 URL + `/api` 를 Vercel `VITE_API_URL` 에 설정.
3. Vercel 프로덕션 origin을 Render `CORS_ORIGINS` 에 설정.
4. `VERCEL_TOKEN`, `RENDER_DEPLOY_HOOK_URL` GitHub secret 등록 → 이후 `main` 푸시로 양 티어 자동 배포.
5. 검증: 프론트 URL 접속 → 네트워크 탭에서 `VITE_API_URL` 호출이 200인지, `/consult` WebSocket이 연결되는지 확인.
