# VS Code 설정

최종 갱신: 2026-09-20

프로젝트 공용 에디터 설정입니다. 파일 4개로 구성되며, 팀원이 저장소를 열면 그대로 적용되도록 커밋 대상에 포함합니다.

| 파일                         | 역할                     |
| ---------------------------- | ------------------------ |
| `extensions.json`            | 추천 익스텐션            |
| `launch.json`                | 디버깅 구성              |
| `tasks.json`                 | 태스크(빌드·린트·테스트) |
| `recipe-share.code-snippets` | 프로젝트 전용 스니펫     |

## 지금 위치가 다릅니다 — 옮겨야 합니다

이 파일들은 `.vscode/`가 아니라 **`vscode-setup/`에 들어 있습니다.** `.vscode`는 `.env`와 마찬가지로 원격 도구의 쓰기가 차단된 경로이기 때문입니다(`launch.json`·`tasks.json`이 임의 명령을 실행할 수 있어 보안 경계로 취급됩니다).

```powershell
mkdir .vscode -Force
Move-Item vscode-setup\* .vscode\
Remove-Item vscode-setup
```

이 명령을 실행하기 전까지 아래 설정은 **아무것도 동작하지 않습니다.**

## 1. 추천 익스텐션

저장소를 열면 VS Code가 설치를 권합니다. 4개로 제한했습니다.

| 익스텐션 ID                 | 이유                                             |
| --------------------------- | ------------------------------------------------ |
| `dbaeumer.vscode-eslint`    | ESLint 9 flat config 기반 린트를 에디터에서 표시 |
| `bradlc.vscode-tailwindcss` | Tailwind 클래스 자동완성                         |
| `prisma.prisma`             | `schema.prisma` 문법 강조·포매팅                 |
| `connor4312.nodejs-testing` | Node 내장 테스트를 VS Code 테스트 탐색기에 연결  |

마지막 항목이 없으면 테스트를 터미널로만 돌려야 합니다. 테스트 러너 자체에 대해서는 [testing.md](./testing.md)를 보십시오.

## 2. 디버깅 구성

`launch.json`에 네 가지와 compound 하나가 있습니다.

| 구성                                  | 동작                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Next.js: 서버 디버그**              | `cwd`를 `apps/web`으로 두고 `NODE_OPTIONS=--inspect`와 함께 `pnpm dev` 실행. 서버 컴포넌트와 Route Handler에 중단점이 걸립니다 |
| **Next.js: 클라이언트 디버그**        | Chrome을 `localhost:3000`으로 띄워 브라우저 측 코드 디버깅                                                                     |
| **현재 테스트 파일 디버그**           | 열려 있는 파일을 `node --test`로 실행                                                                                          |
| **전체 테스트 디버그**                | 워크스페이스 전체 테스트를 `node --test`로 실행                                                                                |
| **Next.js: 풀스택 디버그** (compound) | 서버 + 클라이언트 동시 실행, 한쪽을 멈추면 같이 정지                                                                           |

Windows에서 `pnpm`이 해석되지 않는 문제가 있어 `"windows": { "runtimeExecutable": "pnpm.cmd" }` 분기를 넣어두었습니다.

서버 디버그에는 `serverReadyAction`이 걸려 있어, 터미널에 `- Local: http://localhost:3000`이 찍히면 Chrome이 자동으로 붙습니다.

## 3. 태스크

`Ctrl+Shift+B`(빌드), `Ctrl+Shift+P → Run Test Task`(테스트)로 실행합니다.

| 라벨             | 명령                                     | 비고                        |
| ---------------- | ---------------------------------------- | --------------------------- |
| `dev`            | `pnpm dev`                               | 백그라운드                  |
| `build`          | `pnpm build`                             | 빌드 그룹, `$tsc` 문제 매처 |
| `typecheck`      | `pnpm typecheck`                         | 빌드 그룹, `$tsc` 문제 매처 |
| `lint`           | `pnpm lint`                              | `$eslint-stylish` 문제 매처 |
| `test`           | `pnpm test`                              | **테스트 그룹 기본값**      |
| `test:watch`     | `pnpm test:watch`                        | 백그라운드                  |
| `prisma migrate` | `pnpm --filter @recipe-share/db migrate` |                             |

문제 매처가 붙어 있어 타입 오류와 린트 오류가 '문제' 패널에 파일·줄 단위로 들어옵니다.

## 4. 코드 스니펫

이 프로젝트에서 반복해서 쓰는 패턴만 골랐습니다. `.ts` 파일에서 접두사를 치고 Tab을 누릅니다.

| 접두사        | 생성되는 것                                                          |
| ------------- | -------------------------------------------------------------------- |
| `rh-auth`     | 로그인 가드가 붙은 Route Handler 골격 (feature-spec F10)             |
| `owner-check` | `authorId === userId` 소유권 검증 블록 (risk-analysis #4, IDOR 방지) |
| `rh-params`   | Next 16의 `Promise` 형 `params`를 받는 핸들러 시그니처               |
| `body-parse`  | JSON 본문 안전 파싱 + 필수 문자열 검증                               |
| `test-file`   | `node:test` 테스트 파일 골격                                         |

`owner-check`와 `rh-auth`를 넣은 이유는, 이 둘을 빠뜨리는 것이 risk-analysis가 지적한 #4(IDOR)와 F10(비로그인 차단) 누락으로 바로 이어지기 때문입니다. 손으로 매번 쓰다 보면 빠집니다.

## 넣지 않은 것

`settings.json`은 만들지 않았습니다. 요청 범위(익스텐션·디버깅·테스트·스니펫) 밖이고, 지금 설정으로도 동작합니다. 다만 모노레포에서 ESLint 익스텐션이 flat config를 못 찾거나 TypeScript 버전이 어긋나면 그때 추가하면 됩니다.
