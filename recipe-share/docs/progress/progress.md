# 진행 상황 정리

최종 갱신: 2026-09-20

## 1. 현재 상태 한 줄 요약

설계 문서 3종을 근거로 스캐폴딩을 만들고, 의존성 감사 후 Next 16으로 올렸으며, pnpm workspace monorepo와 VS Code 설정까지 얹었습니다. 이어서 git 훅·Prettier·개발용 Docker 환경까지 붙였습니다. **단, 파일 이동 두 건이 실행되지 않아 저장소는 전환 중간 상태입니다.**

## 2. 수행한 작업

| #   | 작업                | 산출물                                                                    | 정리 문서                                           | 상태                            |
| --- | ------------------- | ------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------- |
| 1   | 설계 문서 3종 분석  | —                                                                         | [design/](../design/)                               | 완료                            |
| 2   | 스캐폴딩 생성       | 파일 21개 (prisma, src/lib, API 라우트 5개, components/ui, Dockerfile 등) | [file-structure.md](./file-structure.md)            | 완료                            |
| 3   | 의존성 감사         | package.json 2건 수정                                                     | [dependency-audit.md](../setup/dependency-audit.md) | 완료                            |
| 4   | Next 16 업그레이드  | 파일 6개                                                                  | [dependency-audit.md](../setup/dependency-audit.md) | 완료                            |
| 5   | pnpm workspace 설정 | 파일 12개                                                                 | [monorepo.md](../setup/monorepo.md)                 | **설정만 완료, 이동 미실행**    |
| 6   | 테스트 러너 설정    | 스크립트 2개 + 테스트 1개                                                 | [testing.md](../setup/testing.md)                   | **설정 완료, 이동 후 동작**     |
| 7   | VS Code 설정        | 파일 4개                                                                  | [vscode.md](../setup/vscode.md)                     | **설정만 완료, 이동 미실행**    |
| 8   | git 훅 3종          | `.githooks/` 3개 + `prepare` 스크립트                                     | [git-hooks.md](../setup/git-hooks.md)               | 제자리 배치 완료                |
| 9   | 린트 구조 수정      | package.json 3개, eslint.config.mjs                                       | [monorepo.md](../setup/monorepo.md) 1-1절           | 완료                            |
| 10  | Prettier 도입       | `.prettierrc`, `.prettierignore`, 스크립트 2개, pre-commit 교체           | [git-hooks.md](../setup/git-hooks.md) 1절           | **설정 완료, 최초 포맷 미실행** |
| 11  | 개발용 Docker 환경  | `Dockerfile.dev`, `compose.yaml`, `.dockerignore`                         | [docker-dev.md](../setup/docker-dev.md)             | **작성 완료, 실행 미검증**      |

## 3. 저장소가 전환 중간 상태인 이유

설정 파일은 모두 올렸으나, **파일을 제자리로 옮기는 작업을 수행하지 못했습니다.** 이 세션의 원격 도구에 이동 기능이 없기 때문입니다. 미뤄진 이동은 두 건입니다.

**(1) monorepo 이동** — 루트에 구 구조와 신 구조가 함께 있습니다.

| 위치                                                                                                                              | 내용                          |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `src/`, `prisma/`, `public/`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `next-env.d.ts`, `eslint.config.mjs` | **구 구조** — 옮겨야 할 파일  |
| `apps/web/`, `packages/db/`, `pnpm-workspace.yaml`, `tsconfig.base.json`                                                          | **신 구조** — 껍데기만 생성됨 |

**(2) VS Code 설정 이동** — `.vscode`는 `.env`와 마찬가지로 원격 쓰기가 차단된 경로라, 설정 파일 4개가 `vscode-setup/`에 들어 있습니다.

이 상태로는 `pnpm install`·`pnpm build`·`pnpm test` 모두 동작하지 않고, 에디터 설정도 적용되지 않습니다.

## 4. 직접 실행하셔야 할 명령

프로젝트 루트에서 PowerShell로 실행합니다.

```powershell
# (1) monorepo 이동
Move-Item src\app, src\components, src\lib\auth.ts, src\lib\storage.ts, src\lib\rate-limit.ts, src\lib\utils.ts apps\web\src -Force
Move-Item public, postcss.config.mjs, tailwind.config.ts, next-env.d.ts apps\web -Force
Move-Item prisma packages\db -Force

Remove-Item src -Recurse -Force
Remove-Item .eslintrc.json, next.config.mjs, node_modules, pnpm-lock.yaml -Recurse -Force

# (2) VS Code 설정 이동
mkdir .vscode -Force
Move-Item vscode-setup\* .vscode\
Remove-Item vscode-setup

# (3) 설치 및 검증
pnpm install
pnpm format
pnpm lint
pnpm typecheck
pnpm test
```

## 4-1. 훅이 지금 커밋을 막습니다

`.githooks/`가 이미 연결되어 있고, pre-commit이 `pnpm lint`를, pre-push가 `pnpm test`를 호출합니다. 위 이동 전에는 둘 다 실패하므로 **모든 커밋과 푸시가 막힙니다.** 이동 전에 커밋해야 한다면 `--no-verify`를 쓰십시오. 자세한 내용은 [git-hooks.md](../setup/git-hooks.md).

## 5. 아직 하지 못해 남은 일

| 항목                       | 사유                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.env`, `.env.local` 생성  | 보안 정책상 원격 도구로 env 파일 쓰기가 차단됨. `packages/db/.env`에 `DATABASE_URL`, `apps/web/.env.local`에 `JWT_SECRET`을 직접 작성해야 함 (`.env.example` 참고) |
| 파일 이동                  | 원격 도구에 해당 기능 없음 (4번 명령으로 대체)                                                                                                                     |
| `pnpm install` 실행        | 승인 없이 실행하지 않음                                                                                                                                            |
| `prisma/dev.db` 생성       | `pnpm --filter @recipe-share/db migrate` 실행 시 생성                                                                                                              |
| Prettier 최초 전체 포맷    | `pnpm format` 실행 시 기존 파일 대부분이 재포맷됨. 포맷 전용 커밋으로 분리할 것 ([git-hooks.md](../setup/git-hooks.md) 1절)                                        |
| `Dockerfile` monorepo 대응 | 경로(`.next/standalone/apps/web`)와 lockfile 위치가 바뀌어 현재 깨진 상태. Node 20 고정도 22로 올려야 함 (`pnpm test`가 22.18+ 필요)                               |
| 개발 Docker 실행 검증      | 이 세션에 Docker가 없어 빌드·hot reload를 확인하지 못함 ([docker-dev.md](../setup/docker-dev.md) 검증 표 참고)                                                     |

## 6. 미해결 보안 사항

[dependency-audit.md](../setup/dependency-audit.md) 참조. Next 14.2.35의 치명적 RCE 2건 때문에 16으로 올렸으나, `pnpm install`이 실행되어야 실제로 반영됩니다. 그 전까지 `node_modules`에는 여전히 14.2.35가 설치되어 있습니다.

## 7. 코드에 반영된 리스크 대응 (risk-analysis.md 기준)

| 리스크                          | 반영 위치                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| #3 업로드 검증                  | `storage.ts` — MIME 화이트리스트 + 5MB 상한 + 매직넘버로 확장자 위장 차단                                  |
| #4 IDOR                         | `api/recipes/[id]/route.ts` — PUT/DELETE에서 `authorId === JWT userId` 검증. 스니펫 `owner-check`로도 제공 |
| #6 로그인 rate limit            | `rate-limit.ts` + `api/auth/login` — IP 기준 5회/분. **테스트 있음**                                       |
| #7 JWT revocation               | 미구현. 만료 2시간으로 타협 (설계 범위 밖)                                                                 |
| #1·#2 배포 환경/스토리지 휘발성 | **미결정.** Dockerfile은 영구 파일시스템 단일 컨테이너를 전제로 작성됨                                     |
