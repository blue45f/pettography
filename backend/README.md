# Pettography Backend

희귀 애완동물(파충류·절지류·희귀 조류·양서류·소형 포유류) 종 선택과 송파구 인근 특수동물 병원·먹이/용품 샵을 안내하는 포탈의 NestJS 11 REST 백엔드입니다.

- 런타임: Node 22 + pnpm 10
- 프레임워크: NestJS 11.x (Express adapter)
- 데이터: in-memory TypeScript seed (`src/data/`)
- DB/ORM 없음 (요구사항)
- 인증 없음 (요구사항)

## 실행

```bash
cd backend
pnpm install
cp .env.example .env   # 선택: 포트 변경시
pnpm dev               # http://localhost:3001/api
```

기타 스크립트:

```bash
pnpm build       # nest build
pnpm start       # nest start (no watch)
pnpm start:prod  # node dist/main.js
pnpm test        # jest
pnpm lint        # eslint --fix
pnpm format      # prettier --write
```

전역 prefix는 `/api`이며 CORS는 `http://localhost:5173` (Vite dev server)에서 허용됩니다.

## 엔드포인트

| Method | Path                          | 설명                                                                                             |
| ------ | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| GET    | `/api/health`                 | `{ status: 'ok', uptime }`                                                                       |
| GET    | `/api/species`                | 종 목록. 쿼리: `category`, `difficulty`, `q` (한글명/학명/slug/태그 부분일치)                    |
| GET    | `/api/species/:idOrSlug`      | 단일 종. id (`sp-001`) 또는 slug (`leopard-gecko`) 둘 다 허용                                    |
| GET    | `/api/hospitals`              | 병원 목록. 쿼리: `category`, `lat`, `lng`, `radiusKm`. 좌표 주면 `distanceKm` 포함 + 거리순 정렬 |
| GET    | `/api/hospitals/:id`          | 단일 병원                                                                                        |
| GET    | `/api/shops`                  | 샵 목록. 쿼리: `category`, `kind` (food/equipment/both), `lat`, `lng`, `radiusKm`                |
| GET    | `/api/care-guides/:speciesId` | 종별 사육 가이드                                                                                 |
| GET    | `/api/communities`            | 외부 커뮤니티 링크. 쿼리: `category`                                                             |

### 쿼리 예시

```
GET /api/species?category=reptile&difficulty=beginner&q=레오파드
GET /api/hospitals?category=reptile&lat=37.5145&lng=127.106&radiusKm=3
GET /api/shops?category=mammal&kind=food
GET /api/communities?category=bird
```

### Forum

| Method | Path                                    | 설명                                                                      |
| ------ | --------------------------------------- | ------------------------------------------------------------------------- |
| GET    | `/api/forum/posts`                      | 게시글 목록. 쿼리: `category` (reptile/arthropod/bird/amphibian/mammal)   |
| POST   | `/api/forum/posts`                      | 게시글 작성. body: `{ category, title, author, body }` → 생성된 Post 반환 |
| GET    | `/api/forum/posts/:id`                  | 단일 게시글 + 댓글 묶음 `{ post, replies }`                               |
| POST   | `/api/forum/posts/:id/replies`          | 댓글 작성. body: `{ author, body }` → 생성된 Reply 반환                   |
| DELETE | `/api/forum/posts/:id`                  | 게시글 삭제 (어드민용, 인증 없음 — demo). 응답 204                        |
| DELETE | `/api/forum/posts/:id/replies/:replyId` | 댓글 삭제 (어드민용). 응답 204                                            |

### Partners

| Method | Path                       | 설명                                                                                          |
| ------ | -------------------------- | --------------------------------------------------------------------------------------------- |
| GET    | `/api/partners`            | 입점 신청 목록. 쿼리: `status` (pending/approved/rejected)                                    |
| POST   | `/api/partners`            | 입점 신청. body: `{ kind, name, contact, region, description, url? }` → status는 자동 pending |
| PATCH  | `/api/partners/:id/status` | 입점 상태 변경 (어드민용). body: `{ status: 'approved' \| 'rejected' }`                       |
| DELETE | `/api/partners/:id`        | 신청 삭제 (어드민용). 응답 204                                                                |

Forum/Partners 데이터는 in-memory(Service 내 mutable array/Map)이며 서버 재시작 시 시드로 리셋됩니다. ID는 `crypto.randomUUID()`로 발급됩니다.

## 시드 데이터 규모

| 도메인      | 개수                 |
| ----------- | -------------------- |
| Species     | 11                   |
| Hospitals   | 7                    |
| Shops       | 9                    |
| Care Guides | 11 (species마다 1개) |
| Communities | 10                   |

좌표는 송파구·강남구(위도 37.49~37.52, 경도 127.04~127.13) 범위의 그럴듯한 mock 값입니다. 모든 종은 한국어 이름과 영문 학명을 함께 보유합니다.

## 디렉토리 구조

```
backend/
├─ src/
│  ├─ app.module.ts
│  ├─ main.ts                      # bootstrap + ValidationPipe + CORS + /api prefix
│  ├─ common/
│  │  ├─ types.ts                  # 도메인 타입 정의
│  │  ├─ geo.ts                    # haversine 거리
│  │  └─ geo.spec.ts
│  ├─ data/                        # in-memory 시드
│  │  ├─ species.seed.ts
│  │  ├─ hospitals.seed.ts
│  │  ├─ shops.seed.ts
│  │  ├─ care-guides.seed.ts
│  │  └─ communities.seed.ts
│  ├─ health/                      # HealthModule
│  ├─ species/                     # SpeciesModule (+ controller spec)
│  ├─ hospitals/                   # HospitalsModule (+ controller spec)
│  ├─ shops/                       # ShopsModule
│  ├─ care-guides/                 # CareGuidesModule
│  └─ communities/                 # CommunitiesModule
├─ test/
├─ package.json
├─ tsconfig.json / tsconfig.build.json
├─ nest-cli.json
├─ eslint.config.mjs / .prettierrc
└─ README.md
```

## 검증

```bash
cd backend
pnpm install
pnpm build
pnpm test
```

전부 통과 시 정상 셋업입니다.
