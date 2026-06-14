# 인증(Auth)

Pettography 백엔드는 이메일/비밀번호 기반 자체 인증을 사용합니다. 세션 토큰은
**서명된 JWT(HS256)**, 비밀번호는 **scrypt 해시**입니다.

## 토큰 스킴

| 용도          | 알고리즘               | 비고                                      |
| ------------- | ---------------------- | ----------------------------------------- |
| 비밀번호 해시 | `scrypt` (`crypto`)    | 변경 없음. `scrypt:<salt>:<hash>` 형식    |
| 세션 토큰     | `HS256` JWT (`crypto`) | `register`/`login` 시 발급. `auth/jwt.ts` |

세션 토큰은 추가 런타임 의존성 없이 Node 내장 `crypto.createHmac`으로 서명한 표준
JWT(`header.payload.signature`, base64url)입니다. 어떤 JWT 라이브러리로도 검증
가능합니다. 페이로드:

```json
{ "sub": "<accountId>", "sid": "<sessionId>", "iat": 0, "exp": 0, "typ": "session" }
```

`sid`(세션 ID) 클레임으로 서버측 세션 행을 찾아 **취소(revocation)** 를 그대로
지원합니다. 즉 로그아웃·비밀번호 변경·정지·탈퇴 시 토큰이 즉시 무효화됩니다.
JWT를 사용하지만 무상태 전용이 아니라 "서명 + 서버측 취소" 하이브리드입니다.

## 엔드포인트 / 프론트엔드 계약 (변경 없음)

- `POST /api/auth/register`, `POST /api/auth/login` → `{ token, type: "Bearer", account }`
- `POST /api/auth/logout` (Authorization: Bearer)
- `GET/PATCH/DELETE /api/auth/me`, 관리자 엔드포인트 동일
- 프론트엔드(`src/domains/auth/*`)는 `Authorization: Bearer <token>` 헤더만 사용하므로
  토큰 내부 형식 변경의 영향을 받지 않습니다.

## 기존(불투명) 토큰 마이그레이션 — 락아웃 없음

이전 스킴은 `randomBytes(32)` 불투명 토큰을 발급하고 scrypt 해시를 세션 행에
저장했습니다. 마이그레이션은 **무중단**입니다.

- `authenticateToken` / `logout`은 토큰을 검사합니다.
  - JWT 형태(점 2개) → 서명·만료 검증 후 `sid`로 세션 조회.
  - 단일 세그먼트(기존 불투명 토큰) → 기존 scrypt 해시 조회로 폴백.
- 따라서 **이미 로그인된 사용자의 기존 불투명 토큰은 만료/로그아웃 전까지 계속
  동작**합니다. 다음 로그인 시 자동으로 JWT로 교체됩니다. 강제 재로그인·회귀 락아웃은
  없습니다.

## 환경변수

| 변수                         | 기본값(dev)                          | 비고                                                    |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------- |
| `PETTOGRAPHY_JWT_SECRET`     | `dev-only-change-me-pettography-jwt` | HS256 서명 키. **프로덕션에서 반드시 강한 값으로 설정** |
| `PETTOGRAPHY_SESSION_TTL_MS` | 14일                                 | 세션/JWT 만료                                           |

프로덕션에서 `PETTOGRAPHY_JWT_SECRET`이 미설정이거나 알려진 dev 기본값이면
부팅 시 비차단 경고를 출력합니다(`src/config/env.ts`). 시크릿을 교체하면 발급된
모든 JWT가 무효화되며 사용자는 단순히 재로그인합니다.

```bash
PETTOGRAPHY_JWT_SECRET=$(openssl rand -base64 48)
```

## 소셜 로그인(Google Identity Services) — 외부 키 의존성

현재 코드베이스에는 Google/GIS 등 소셜 로그인 버튼이 **없습니다**. 추가하려면
다음과 같은 **외부 키 의존성**이 필요하므로 본 마이그레이션 범위에서 제외하고
문서로만 남깁니다(깨진/더미 버튼은 추가하지 않음).

- Google Cloud Console에서 OAuth 2.0 클라이언트(웹) 생성 → `client_id` 발급
- 승인된 JS origin / 리디렉션 URI 등록
- 프론트 `VITE_GOOGLE_CLIENT_ID`, 백엔드 ID 토큰 검증(audience=client_id) 설정

키 발급은 콘솔 수동 작업이라 코드만으로 완결할 수 없습니다. 키 확보 후
ID 토큰을 검증해 기존 `issueSession` 경로로 동일한 `{ token, type, account }` 세션
JWT를 발급하면 본 스킴에 그대로 얹을 수 있습니다.
