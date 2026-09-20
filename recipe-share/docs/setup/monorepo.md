# pnpm workspace monorepo 구성

최종 갱신: 2026-09-20

## 먼저 짚을 것

앱이 `web` 하나뿐인 지금 시점에서 monorepo는 실익이 없습니다. 패키지가 둘 이상일 때부터 의미가 생기는 구조입니다. 다만 요청에 따라, 요청하신 세 가지(루트 공통 의존성 / 패키지 간 연결 / TS 프로젝트 레퍼런스)가 실제로 성립하는 **최소 구성**으로 짰습니다.

패키지를 둘로 나눈 기준은 하나뿐입니다. `packages/db`(Prisma 스키마 + Client)는 앞으로 워커·시드 스크립트·CLI가 생기면 그대로 공유되는 부분이라 분리에 근거가 있습니다. 그 외에는 나누지 않았습니다.

## 패키지 구성

| 패키지              | 경로          | 역할                                |
| ------------------- | ------------- | ----------------------------------- |
| `@recipe-share/web` | `apps/web`    | Next.js 앱 (UI + API 라우트)        |
| `@recipe-share/db`  | `packages/db` | Prisma 스키마, Prisma Client 싱글턴 |

`pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

## 1. 공통 의존성을 루트에 설치

**주의할 점이 하나 있습니다.** pnpm은 hoisting이 엄격하여, 루트에 설치한 의존성이 하위 패키지로 자동으로 새어나가지 않습니다. npm/yarn 감각으로 런타임 의존성을 루트에 몰아두면 하위 패키지에서 import가 실패합니다.

따라서 배치 기준은 이렇습니다.

- **루트** — 저장소 전역에서 명령으로 실행되는 도구만
- **각 패키지** — 그 패키지가 실제로 `import` 하는 것

| 위치          | 패키지                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------- |
| 루트          | `typescript`, `eslint`, `eslint-config-next`, `prettier`, `@types/node`                        |
| `apps/web`    | `next`, `react`, `react-dom`, `bcryptjs`, `jsonwebtoken`, `tailwindcss`, `postcss`, `@types/*` |
| `packages/db` | `@prisma/client`, `prisma`                                                                     |

루트 `package.json`

```json
{
  "name": "recipe-share",
  "private": true,
  "scripts": {
    "prepare": "git config core.hooksPath .githooks || true",
    "dev": "pnpm --filter @recipe-share/web dev",
    "build": "pnpm --filter @recipe-share/web build",
    "start": "pnpm --filter @recipe-share/web start",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc -b",
    "test": "node --test \"apps/web/src/**/*.test.ts\" \"packages/*/src/**/*.test.ts\"",
    "test:watch": "node --test --watch \"apps/web/src/**/*.test.ts\" \"packages/*/src/**/*.test.ts\""
  },
  "devDependencies": {
    "@types/node": "^20.9",
    "eslint": "^9",
    "eslint-config-next": "^16.3.5",
    "prettier": "^3.6.2",
    "typescript": "^5"
  }
}
```

## 1-1. 린트는 루트에서 한 번만

처음에는 `"lint": "pnpm -r lint"` 로 각 패키지의 `lint` 스크립트를 호출하려 했습니다. **이 방식에는 구멍이 있었습니다.** `packages/db`에 `lint` 스크립트가 없으면 pnpm이 오류 없이 **조용히 건너뜁니다.** 린트가 도는 것처럼 보이지만 `packages/db/src/index.ts`는 한 번도 검사되지 않습니다.

패키지마다 `lint` 스크립트와 `eslint.config.mjs`를 두면 해결되지만, 설정 파일이 패키지 수만큼 늘어납니다. 대신 **flat config 하나를 루트에 두고 `eslint .` 를 한 번 실행합니다.**

|                      | 변경 전                      | 변경 후                    |
| -------------------- | ---------------------------- | -------------------------- |
| 루트 `lint`          | `pnpm -r lint`               | `eslint .`                 |
| `apps/web` `lint`    | `eslint .`                   | 삭제                       |
| `packages/db` `lint` | 없음 (누락)                  | 불필요 — 루트가 커버       |
| config 위치          | `apps/web/eslint.config.mjs` | `eslint.config.mjs` (루트) |
| `eslint-config-next` | `apps/web` devDep            | 루트 devDep                |

`eslint-config-next`를 루트로 옮긴 이유는 pnpm의 엄격한 hoisting 때문입니다. 루트의 config가 `apps/web`에 설치된 패키지를 import할 수 없습니다.

이 결정 때문에 `eslint.config.mjs`는 **`apps/web`으로 옮기지 않고 루트에 둡니다.** [progress.md](../progress/progress.md) 4절의 이동 명령에도 반영되어 있습니다.

`test` 스크립트에 테스트 의존성이 없는 이유는 [testing.md](./testing.md)에 정리했습니다. 에디터 설정은 [vscode.md](./vscode.md), 커밋 시 자동 검사는 [git-hooks.md](./git-hooks.md)를 보십시오.

## 2. 패키지 간 의존성 연결

`apps/web/package.json`이 `workspace:*` 프로토콜로 `packages/db`를 물립니다. 레지스트리를 거치지 않고 심링크로 연결되며, 버전 관리가 필요 없습니다.

```json
{
  "name": "@recipe-share/web",
  "dependencies": {
    "@recipe-share/db": "workspace:*",
    "next": "^16.3.5"
  }
}
```

`packages/db`는 빌드 단계 없이 TS 소스를 그대로 노출합니다.

```json
{
  "name": "@recipe-share/db",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" }
}
```

이를 Next가 트랜스파일하도록 `apps/web/next.config.mjs`에 한 줄을 더했습니다.

```js
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@recipe-share/db'],
};
```

**기존 라우트 5개는 수정하지 않았습니다.** `apps/web/src/lib/db.ts`를 한 줄 재export로 남겨, 기존 `@/lib/db` import가 그대로 동작합니다.

```ts
export { prisma } from '@recipe-share/db';
```

## 3. TypeScript 프로젝트 레퍼런스

구성은 셋으로 나눕니다.

| 파일                        | 역할                                                     |
| --------------------------- | -------------------------------------------------------- |
| `tsconfig.base.json`        | 공통 컴파일러 옵션 (strict, target, moduleResolution 등) |
| `tsconfig.json`             | 솔루션 파일. `files: []` + `references`만 가짐           |
| 각 패키지의 `tsconfig.json` | base를 extends + 패키지별 설정                           |

`packages/db/tsconfig.json` — 참조 대상이므로 `composite: true`가 필수이며, 선언 파일만 내보냅니다.

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "emitDeclarationOnly": true,
    "declaration": true,
    "declarationMap": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
```

`apps/web/tsconfig.json` — Next가 요구하는 `noEmit: true`를 유지한 채 `packages/db`를 참조합니다. 참조하는 쪽은 composite일 필요가 없습니다.

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "references": [{ "path": "../../packages/db" }]
}
```

루트 `tsconfig.json` — 솔루션 파일. `apps/web`은 넣지 않았습니다. Next가 `noEmit`을 강제하는데 `tsc -b`의 빌드 그래프에 들어가면 composite 요구와 충돌하기 때문입니다. 앱의 타입 검사는 `next build`가 담당합니다.

```json
{
  "files": [],
  "references": [{ "path": "./packages/db" }]
}
```

`pnpm typecheck`(= `tsc -b`)가 `packages/db`의 선언을 빌드하고, 앱은 그 결과를 참조합니다.

## 실행해야 할 명령

설정 파일은 모두 올렸으나 **파일 이동은 수행하지 못했습니다.** 이 세션의 원격 도구에 이동·삭제 기능이 없기 때문입니다. 프로젝트 루트에서 PowerShell로 실행하십시오.

```powershell
Move-Item src\app, src\components, src\lib\auth.ts, src\lib\storage.ts, src\lib\rate-limit.ts, src\lib\utils.ts apps\web\src -Force
Move-Item public, postcss.config.mjs, tailwind.config.ts, next-env.d.ts apps\web -Force
# eslint.config.mjs 는 루트에 둡니다 (1-1절)
Move-Item prisma packages\db -Force

Remove-Item src -Recurse -Force
Remove-Item .eslintrc.json, next.config.mjs, node_modules, pnpm-lock.yaml -Recurse -Force

pnpm install
pnpm format
pnpm lint
pnpm typecheck
pnpm test
```

env 파일은 보안 정책상 원격 도구로 쓸 수 없어 직접 만드셔야 합니다.

| 파일                  | 내용                                                    |
| --------------------- | ------------------------------------------------------- |
| `packages/db/.env`    | `DATABASE_URL="file:./dev.db"` — Prisma CLI가 읽는 위치 |
| `apps/web/.env.local` | `JWT_SECRET=...`, `JWT_EXPIRES_IN="2h"`                 |

이후 `pnpm --filter @recipe-share/db migrate` 로 `packages/db/prisma/dev.db`가 생성됩니다.

## 아직 깨져 있는 것

`Dockerfile`이 monorepo를 반영하지 못했습니다. 단일 패키지 기준으로 작성되어 있어 두 곳이 어긋납니다.

- `COPY package.json pnpm-lock.yaml ./` — 워크스페이스에서는 각 패키지의 manifest와 `pnpm-workspace.yaml`까지 복사해야 함
- standalone 산출물 경로가 `.next/standalone` → `.next/standalone/apps/web` 으로 바뀜

배포에 착수하실 때 수정이 필요합니다.
