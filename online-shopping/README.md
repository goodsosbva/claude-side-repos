# online-shop

온라인 쇼핑몰 MVP — pnpm workspace 모노레포 (Next.js + NestJS)

## 1. 프로젝트 개요

상품 조회 · 장바구니 · 주문/결제 흐름을 제공하는 온라인 쇼핑몰 MVP입니다.
`web`(고객 화면)과 `api`(백엔드)를 분리하고, 공통 타입/컴포넌트는 `shared`/`ui` 패키지로 공유합니다.

```
online-shop/
├── packages/
│   ├── web/      # Next.js 프론트엔드 (App Router)
│   ├── api/      # NestJS 백엔드
│   ├── shared/   # 공통 타입 · 유틸
│   └── ui/       # 공통 React 컴포넌트
├── docker/       # Dockerfile, docker-compose, DB 초기화 스크립트
└── scripts/      # 운영 스크립트(GitHub 이슈 생성 등)
```

## 2. 기술 스택

| 영역 | 스택 |
|---|---|
| 프론트엔드 | Next.js 15, React 18, TypeScript |
| 백엔드 | NestJS 10, TypeScript |
| DB | PostgreSQL |
| 인프라 | Docker / Docker Compose |
| 패키지 매니저 | pnpm (workspace) |
| 코드 품질 | ESLint(flat config) + Prettier, husky + lint-staged |

## 3. 설치 가이드

**요구 사항:** Node.js ≥ 20, pnpm, Docker

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수 설정 (4번 항목 참고)
cp .env.example .env

# 3-a. DB만 Docker로 띄우고 앱은 로컬에서 실행
pnpm docker:up          # postgres 컨테이너만 필요 시 docker-compose에서 postgres만 선택 실행
pnpm dev                # web(:3000) + api(:4000) 동시 실행

# 3-b. 전체를 Docker로 실행
pnpm docker:up           # postgres + api + web
pnpm docker:down
```

설치 후 확인:
- 웹: http://localhost:3000
- API: http://localhost:4000

## 4. 환경 변수 설정

`.env.example`을 복사해 `.env`로 사용합니다. (`.env`는 git에 커밋되지 않습니다)

| 변수 | 설명 | 기본값 |
|---|---|---|
| `NODE_ENV` | 실행 환경 | `development` |
| `WEB_PORT` | 웹(Next.js) 포트 | `3000` |
| `NEXT_PUBLIC_API_URL` | 웹에서 바라보는 API 주소 | `http://localhost:4000` |
| `API_PORT` | API(NestJS) 포트 | `4000` |
| `DATABASE_URL` | PostgreSQL 연결 문자열 | `postgresql://shop:shop@localhost:5432/shop` |
| `POSTGRES_USER` | DB 사용자 | `shop` |
| `POSTGRES_PASSWORD` | DB 비밀번호 | `shop` |
| `POSTGRES_DB` | DB 이름 | `shop` |

## 5. API 문서

> 아직 Swagger가 연결되어 있지 않습니다. `@nestjs/swagger` 연동 후 `api` 실행 상태에서
> **http://localhost:4000/docs** 에서 확인할 수 있도록 준비 중입니다.

현재는 `packages/api/src/modules` 하위 각 모듈의 `*.controller.ts`가 API 스펙의 기준입니다.

## 6. 컨트리뷰션 가이드

1. **브랜치 전략**: `main`에서 분기, `feat/`, `fix/`, `chore/` 접두사 사용 (예: `feat/cart-api`)
2. **커밋 전 자동 검사**: `git commit` 시 husky pre-commit 훅이 변경 파일에 대해 `eslint --fix` + `prettier`를 자동 실행합니다. 실패하면 커밋이 막히니 직접 `pnpm lint`, `pnpm format`으로 먼저 확인하세요.
3. **커밋 메시지**: `type: 내용` 형식 권장 (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`)
4. **PR 전 체크리스트**
   - `pnpm typecheck` 통과
   - `pnpm test` 통과
   - 관련 패키지의 `pnpm lint` 통과
5. **PR 설명**: 변경 이유와 테스트 방법을 간단히 작성

## 스크립트 모음

| 명령 | 설명 |
|---|---|
| `pnpm dev` | web + api 동시 개발 서버 실행 |
| `pnpm build` | 전체 패키지 빌드 |
| `pnpm test` | 전체 테스트 실행 |
| `pnpm typecheck` | 전체 타입 체크 |
| `pnpm lint` / `pnpm format` | 린트 / 포맷 |
| `pnpm docker:up` / `pnpm docker:down` | Docker 스택 기동 / 종료 |
