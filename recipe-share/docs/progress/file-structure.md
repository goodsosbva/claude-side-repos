# 파일 구조도

최종 갱신: 2026-09-20

## 현재 디스크 상태 (전환 중)

직접 조회한 실제 상태입니다. `구`는 옮겨야 할 파일, `신`은 이번 작업으로 새로 만든 파일입니다.

```
recipe-share/
├─ .git/
├─ apps/                                     # 신
│  └─ web/
│     ├─ src/lib/
│     │  ├─ db.ts                            # 신 — @recipe-share/db 재export
│     │  └─ rate-limit.test.ts               # 신 — 이동 전이라 아직 실패함
│     ├─ next.config.mjs                     # 신 — transpilePackages 포함
│     ├─ package.json                        # 신 — @recipe-share/web
│     └─ tsconfig.json                       # 신 — references: packages/db
├─ docs/
│  ├─ design/
│  │  ├─ architecture.md
│  │  ├─ feature-spec.md
│  │  └─ risk-analysis.md
│  ├─ progress/
│  │  ├─ file-structure.md
│  │  └─ progress.md
│  ├─ setup/
│  │  ├─ dependency-audit.md
│  │  ├─ monorepo.md
│  │  ├─ testing.md                          # 신
│  │  └─ vscode.md                           # 신
│  └─ README.md
├─ node_modules/                             # 구 — 삭제 후 재설치 대상
├─ packages/                                 # 신
│  └─ db/
│     ├─ src/index.ts                        # 신 — Prisma Client 싱글턴
│     ├─ package.json                        # 신 — @recipe-share/db
│     └─ tsconfig.json                       # 신 — composite: true
├─ prisma/                                   # 구 → packages/db/prisma
│  └─ schema.prisma
├─ public/                                   # 구 → apps/web/public
│  └─ uploads/.gitkeep
├─ src/                                      # 구 → apps/web/src
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ auth/{login,signup}/route.ts
│  │  │  ├─ recipes/route.ts
│  │  │  ├─ recipes/[id]/route.ts
│  │  │  └─ upload/route.ts
│  │  ├─ fonts/{GeistMonoVF,GeistVF}.woff
│  │  ├─ favicon.ico
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/ui/{button,card,input,textarea}.tsx
│  └─ lib/
│     ├─ auth.ts
│     ├─ db.ts                               # 구 — 삭제 대상 (apps/web 쪽으로 대체됨)
│     ├─ rate-limit.ts
│     ├─ storage.ts
│     └─ utils.ts
├─ vscode-setup/                             # 신 — .vscode/로 옮겨야 함
│  ├─ extensions.json
│  ├─ launch.json
│  ├─ recipe-share.code-snippets
│  └─ tasks.json
├─ .dockerignore
├─ .env.example
├─ .eslintrc.json                            # 구 — 삭제 대상 (flat config로 대체)
├─ .gitignore                                # 신 — monorepo 경로로 갱신
├─ compose.yaml                              # 신 — 개발용
├─ Dockerfile                                # monorepo 대응 미반영
├─ Dockerfile.dev                            # 신 — 개발용 (node:22)
├─ eslint.config.mjs                         # 루트 유지 — 워크스페이스 전체 린트
├─ .prettierrc                               # 신 — singleQuote, printWidth 100
├─ .prettierignore                           # 신
├─ next-env.d.ts                             # 구 → apps/web
├─ next.config.mjs                           # 구 — 삭제 대상
├─ package.json                              # 신 — workspace 루트 + test 스크립트
├─ pnpm-lock.yaml                            # 구 — 재생성 대상
├─ pnpm-workspace.yaml                       # 신
├─ postcss.config.mjs                        # 구 → apps/web
├─ README.md
├─ tailwind.config.ts                        # 구 → apps/web
├─ tsconfig.base.json                        # 신 — 공통 컴파일러 옵션
└─ tsconfig.json                             # 신 — 솔루션 파일
```

## 이동 완료 후의 목표 구조

```
recipe-share/
├─ .vscode/                                  vscode-setup/에서 이동
│  ├─ extensions.json
│  ├─ launch.json
│  ├─ recipe-share.code-snippets
│  └─ tasks.json
├─ apps/
│  └─ web/                                   @recipe-share/web
│     ├─ public/uploads/.gitkeep
│     ├─ src/
│     │  ├─ app/
│     │  │  ├─ api/
│     │  │  │  ├─ auth/{signup,login}/route.ts
│     │  │  │  ├─ recipes/route.ts
│     │  │  │  ├─ recipes/[id]/route.ts
│     │  │  │  └─ upload/route.ts
│     │  │  ├─ fonts/
│     │  │  ├─ favicon.ico
│     │  │  ├─ globals.css
│     │  │  ├─ layout.tsx
│     │  │  └─ page.tsx
│     │  ├─ components/ui/{button,card,input,textarea}.tsx
│     │  └─ lib/
│     │     ├─ auth.ts
│     │     ├─ db.ts
│     │     ├─ rate-limit.ts
│     │     ├─ rate-limit.test.ts
│     │     ├─ storage.ts
│     │     └─ utils.ts
│     ├─ .env.local                           JWT_SECRET (직접 생성 필요)
│     ├─ next.config.mjs
│     ├─ next-env.d.ts
│     ├─ package.json
│     ├─ postcss.config.mjs
│     ├─ tailwind.config.ts
│     └─ tsconfig.json
├─ packages/
│  └─ db/                                    @recipe-share/db
│     ├─ prisma/
│     │  ├─ schema.prisma
│     │  └─ dev.db                            migrate 실행 시 생성
│     ├─ src/index.ts
│     ├─ .env                                 DATABASE_URL (직접 생성 필요)
│     ├─ package.json
│     └─ tsconfig.json
├─ docs/
├─ .githooks/
│  ├─ commit-msg
│  ├─ pre-commit
│  └─ pre-push
├─ .dockerignore
├─ .env.example
├─ .gitignore
├─ compose.yaml                               개발용
├─ Dockerfile                                 monorepo 대응 필요
├─ Dockerfile.dev                             개발용
├─ eslint.config.mjs                          워크스페이스 전체 린트
├─ .prettierrc
├─ .prettierignore
├─ README.md
├─ package.json                               workspace 루트
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
└─ tsconfig.json
```

## 의존성 배치 원칙

pnpm은 hoisting이 엄격하여 루트 의존성이 하위 패키지로 새어나가지 않습니다. 루트에는 전역 도구만 두고, 런타임 의존성은 실제로 import하는 패키지에 둡니다.

| 위치          | 패키지                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| 루트          | `typescript`, `eslint`, `eslint-config-next`, `prettier`, `@types/node`                                             |
| `apps/web`    | `next`, `react`, `react-dom`, `bcryptjs`, `jsonwebtoken`, `tailwindcss`, `postcss`, `@recipe-share/db`(workspace:*) |
| `packages/db` | `@prisma/client`, `prisma`                                                                                          |

자세한 근거는 [monorepo.md](../setup/monorepo.md)를 보십시오.
