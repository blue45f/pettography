# Design

## Theme

라이트 기본. 배경에 부드러운 indigo→coral 라디얼 그라디언트 베이스를 깔아 도메인의 따뜻함을 살리고, 본문 surface는 거의 흰색에 가까운 tinted neutral. 다크 모드는 동등 품질로 지원(`[data-theme="dark"]`), 야간 사용 시 눈 부담 적게.

Scene: 잠실에서 첫 레오파드 게코를 입양한 27세 회사원이 화요일 저녁 8시 거실에서 폰으로 일지에 사료량을 적고, 일요일 오후 노트북으로 다음 달 진료 병원을 찾는 그림.

## Color

전략: **Restrained + Committed accent**. 본문은 tinted neutral 99%, indigo→coral committed accent는 CTA·active state·hero에만. 응급은 별도 warm red(coral-600). 카테고리·상태 배지는 정해진 5개 의미 색만 사용.

| Token                    | Light     | Dark                                           | 용도                               |
| ------------------------ | --------- | ---------------------------------------------- | ---------------------------------- |
| `--color-primary-600`    | `#4f46e5` | (dark에서는 `--color-primary-300` = `#a5b4fc`) | CTA, active link, focus ring       |
| `--color-accent-500`     | `#f43f5e` | `#fb7185`                                      | 보조 accent, 응급 신호 보조        |
| `--color-error`          | `#ef4444` | `#fca5a5`                                      | 응급 진료 배지, 폼 오류            |
| `--color-success`        | `#16a34a` | `#4ade80`                                      | 정부 등록, 승인                    |
| `--color-warning`        | `#f59e0b` | `#fcd34d`                                      | 검토 대기, 미등록 주의             |
| `--color-info`           | `#0ea5e9` | `#38bdf8`                                      | 보조 정보                          |
| `--color-background`     | `#fafafa` | `#0b1120`                                      | body 배경(위에 hero gradient 합성) |
| `--color-surface`        | `#ffffff` | `#111827`                                      | 카드/입력 표면                     |
| `--color-surface-muted`  | `#f5f5f7` | `#1e293b`                                      | 보조 표면(답글, 칩)                |
| `--color-text`           | `#0f172a` | `#f1f5f9`                                      | 본문                               |
| `--color-text-secondary` | `#475569` | `#cbd5e1`                                      | 메타                               |
| `--color-text-muted`     | `#94a3b8` | `#94a3b8`                                      | 비활성                             |

Gradient `--gradient-brand` (`#6366f1 → #8b5cf6 → #f43f5e`)는 **CTA·active nav·BottomNav 표시·landing hero**에만. 텍스트 그라디언트 금지. 로고는 단색(indigo-600)으로 통일.

## Typography

폰트: Pretendard Variable 우선(index.html에서 jsdelivr dynamic subset CSS 로드, `font-display: swap`), 시스템 sans 폴백. display 헤딩은 letter-spacing -0.01em + text-wrap: balance.

Scale: clamp() fluid, 320~1280 viewport 사이 부드럽게 보간.

| Step                | Min                | Max | 용도 |
| ------------------- | ------------------ | --- | ---- |
| `xs` 0.7→0.78rem    | meta, badge        |
| `sm` 0.82→0.92rem   | 본문 보조, 폼 라벨 |
| `base` 0.94→1.05rem | 본문               |
| `lg` 1.05→1.18rem   | 카드 타이틀        |
| `xl` 1.18→1.32rem   | 섹션 헤딩          |
| `2xl` 1.35→1.65rem  | 페이지 sub-hero    |
| `3xl` 1.65→2.15rem  | 페이지 H1          |
| `4xl` 2.0→2.85rem   | landing hero       |
| `5xl` 2.4→3.5rem    | (예약)             |

비율 ≥1.25 보장. 본문 line-length는 카드/메인 컨테이너로 자연 제한(약 65~75ch).

## Elevation

| Token           | 용도                                |
| --------------- | ----------------------------------- |
| `--shadow-xs`   | 칩, 인풋                            |
| `--shadow-sm`   | 일반 카드                           |
| `--shadow-md`   | 강조 카드, 액티브 vet 카드          |
| `--shadow-lg`   | 드롭다운 메뉴, modal                |
| `--shadow-glow` | focus ring 강조(active vet card 등) |

Glass(backdrop-filter blur)는 **Header sticky bar + BottomNav 두 곳에만**. 일반 카드에는 사용 금지.

## Motion

`--motion-fast: 120ms`, `--motion-base: 200ms`, `--motion-slow: 320ms`, 모두 cubic-bezier(0.4, 0, 0.2, 1) (ease-out). 호버는 fast, 상태 변화는 base, 페이지 진입은 slow. layout 속성(width/height/top/left) 애니메이션 금지, transform·opacity·color만. `prefers-reduced-motion: reduce` 시 모든 트랜지션 0.01ms.

## Components

- **Card**: `--shadow-sm`, `--radius-lg`, padding md/lg 두 단계. 같은 페이지에서 모양이 같은 카드를 6개 이상 나란히 두지 않는다.
- **Badge**: 5 변형(default/primary/success/warning/error). 색만이 아니라 텍스트 라벨 필수.
- **Button**: primary(gradient), outline(border + text primary), ghost(text only), 모두 44×44 최소 터치 타겟.
- **Chip filter**: pill 모양 + active 시 `--gradient-brand` 채우기 흰 글자.
- **Toast**: 화면 top center, slide-down fast.
- **Header**: glass sticky + brand logo solid + pill nav. ≤860px에서 햄버거 + actions 슬라이드.
- **BottomNav**: ≤860px에서만, glass + 5탭 + 활성 탭은 상단 2px primary 보더 + soft 배경.
- **KakaoMap**: env 키 없으면 placeholder. 있으면 마커 + popup.
- **EmptyState**: 페이지의 register에 맞춰 빈 화면을 조율하는 `variant` prop. 56개 화면이 같은 빈 박스를 보여주던 것을 도메인 표현형 프라이머로 전환.
  - `default` — 조용·airy·무테두리. 안전한 fallback(미이전 호출부 그대로 동작).
  - `log` — 급이/투약/탈피/수질 등 husbandry 기록 페이지의 first-run 프라이머. tinted 패널(surface-muted + soft border + radius-lg) + 소프트 아이콘 medallion(primary-soft) + 선택적 `hint`(이 기록이 무엇에 쓰이는지/시작 한 걸음을 가르치는 한 줄). 입력 폼이 이미 페이지에 있을 때 사용.
  - `discover` — 종/병원/샵/마켓 등 검색·탐색 결과 빈 상태. 필터와 경쟁하지 않게 조용히 유지.
  - `gated` — 선행 조건 미충족(반려동물·수의사 먼저 선택). `log`와 같은 패널이되 medallion은 muted 톤으로 "이것부터" 신호.
  - on-brand by construction: hero-metric·side-stripe 금지. `hint`는 contained 변형(`log`/`gated`)에서만 렌더.

## Layout

- `--layout-max: 1200px`, `--layout-pad: clamp(1rem, 0.7rem + 1.4vw, 2rem)` 메인 컨테이너. safe-area-inset 양옆/하단 reservation.
- 페이지 root는 `display: flex; flex-direction: column; gap: var(--spacing-lg)`. 섹션 사이 호흡은 spacing-xl, 카드 사이는 spacing-md.
- grid는 `repeat(auto-fit, minmax(min(100%, NNNpx), 1fr))` 패턴으로 통일 — 컨테이너가 좁아지면 자동 1열.
- ≤860px에서 main에 `padding-bottom: spacing-xl + 72px + safe-pad-bottom` (BottomNav reservation).

## Anti-patterns (이 프로젝트에서 금지)

- 같은 모양 카드 7개 이상 나란히 (페이지 단조). 정보 결에 따라 다른 affordance 사용.
- 텍스트 그라디언트 (`background-clip: text`). 신뢰감 도메인에서 swiped-from-template 인상.
- 빈 hero-metric 패턴(big number + label + accent line)으로 통계 표시. StatTile은 의미 라벨과 정량값 균등 비중.
- modal 남발. 인라인 expand 우선.
- 카드 안에 카드(nested). 절대 금지.
- side-stripe border(`border-left: 4px solid ...`). 카드 전체 border + 배지로 대체.
