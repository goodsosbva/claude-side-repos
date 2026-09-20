# 테스트 설정

최종 갱신: 2026-09-20

## 결론

| 층위        | 도구                             | 위치                             |
| ----------- | -------------------------------- | -------------------------------- |
| 유닛        | Jest 30                          | `*.test.ts` (소스 옆)            |
| 컴포넌트    | Jest + React Testing Library     | `*.test.tsx` (소스 옆)           |
| E2E         | Playwright                       | `e2e/*.spec.ts`                  |
| 커버리지    | Jest 내장 (루트에서 합산)        | `coverage/`                      |

## node:test 를 버린 이유

이전 설정은 Node 내장 러너였고, 의존성이 0개라는 점에서 훌륭했습니다. 버린 이유는 하나입니다. **컴포넌트 테스트**가 필요해졌기 때문입니다.

React 컴포넌트를 렌더링하려면 JSX 변환과 DOM 구현(jsdom)이 붙어야 합니다. `node:test` 로도 못 할 것은 없지만, 변환기와 jsdom 환경과 매처를 각각 손으로 엮어야 합니다. 그렇게 조립하고 나면 결국 Jest 를 다시 만든 꼴이 되고, 그 조립물은 우리만 아는 물건이 됩니다. Next 가 `next/jest` 로 SWC 변환·CSS 모킹·`tsconfig` 경로 별칭을 이미 맞춰 주므로, 그쪽에 올라타는 편이 싸게 먹힙니다.

부수적으로, Node 22.18 이상이라는 제약이 사라졌습니다. 타입 스트리핑에 기대지 않기 때문입니다. `Dockerfile.dev` 가 `node:22-alpine` 인 것은 이제 필수가 아니라 여유입니다. 되돌릴 이유도 없으니 그대로 둡니다.

## 파일 배치

```
jest.config.mjs                    루트 — 프로젝트 묶기 + 커버리지 집계
apps/web/jest.config.mjs           web 프로젝트 (next/jest, jsdom)
apps/web/jest.setup.ts             @testing-library/jest-dom 매처 등록
packages/db/jest.config.mjs        db 프로젝트 (@swc/jest, node)
playwright.config.ts               e2e 설정 + 개발서버 기동
e2e/global-setup.ts                e2e 전용 DB 초기화
e2e/*.spec.ts                      e2e 시나리오
```

Jest 는 루트에서 러너를 직접 돌리지 않고 `projects` 로 두 프로젝트를 묶기만 합니다. 프로젝트마다 환경이 다르기 때문입니다. `apps/web` 은 jsdom 이 필요하고 `packages/db` 는 node 면 충분합니다. 반대로 커버리지는 프로젝트별로 내면 합산이 되지 않으므로 루트에서 한 번에 집계합니다.

## 실행

```bash
pnpm test            # 유닛 + 컴포넌트 전부
pnpm test:watch      # 변경 감시
pnpm test:coverage   # 커버리지까지

pnpm test:e2e        # Playwright. 개발서버는 알아서 띄웁니다
pnpm test:e2e:ui     # 브라우저 UI 모드
pnpm test:e2e:report # 마지막 리포트 열기
```

E2E 는 최초 1회 브라우저 바이너리를 받아야 합니다.

```bash
pnpm exec playwright install chromium
```

## next/jest 의 함정 하나

`apps/web/jest.config.mjs` 에서 `nextJest({ dir: ... })` 에 절대경로를 넘깁니다. 상대경로 `'./'` 를 쓰면 안 됩니다.

이 `dir` 은 설정 파일 위치가 아니라 **`process.cwd()` 기준**으로 풀립니다. 루트에서 `pnpm test` 를 돌리면 cwd 가 저장소 루트가 되고, 거기에는 `app` 디렉터리가 없으니 Next 가 이렇게 뱉으며 죽습니다.

```
Couldn't find any `pages` or `app` directory. Please create one under the project root
```

`import.meta.url` 로 설정 파일 자신의 위치를 구해 넘기면 어디서 실행하든 같습니다.

## 커버리지 임계값은 목표가 아니라 래칫입니다

현재 실측값입니다.

| 항목       | 값     |
| ---------- | ------ |
| statements | 7.43%  |
| branches   | 5.29%  |
| functions  | 6.45%  |
| lines      | 7.89%  |

낮습니다. 당연합니다. 지금 테스트는 `rate-limit.ts` 와 `Button` 둘뿐인데, 커버리지 분모에는 라우트 핸들러 5개와 `auth.ts`·`storage.ts` 가 통째로 들어가 있습니다.

`jest.config.mjs` 의 `coverageThreshold` 는 이 실측값 바로 아래에 못박아 두었습니다. **올라가야 할 목표가 아니라, 내려가면 깨지라고 둔 바닥입니다.** 테스트를 추가하면 그만큼 숫자를 올려서 다시 못박으십시오. 처음부터 60% 같은 숫자를 적어 두면 첫 실행부터 빨간불이 뜨고, 그러면 아무도 그 숫자를 믿지 않게 됩니다.

`coverageReporters` 는 `text`(터미널), `lcov`(CI·에디터 연동), `html`(`coverage/index.html`) 셋입니다.

## E2E 설계에서 신경 쓴 것

**DB 를 분리했습니다.** e2e 는 `packages/db/prisma/e2e.db` 를 씁니다. 개발용 `dev.db` 를 건드리면 테스트가 폐하의 데이터를 지웁니다. `e2e/global-setup.ts` 가 매 실행마다 그 파일을 지우고 `prisma db push` 로 스키마를 다시 밀어 넣으므로, 항상 빈 DB 에서 시작합니다. 마이그레이션 파일이 생기고 나면 이 자리를 `prisma migrate deploy` 로 바꾸는 편이 낫습니다.

**auth 를 건드리는 스펙은 직렬입니다.** `rate-limit.ts` 가 IP 당 분당 5회로 회원가입·로그인을 막습니다. 병렬로 던지면 테스트가 429 를 받고 엉뚱하게 실패합니다. `recipes.spec.ts` 상단에 `test.describe.configure({ mode: 'serial' })` 를 둔 이유입니다. 이 파일에 인증 호출을 더 넣을 때는 분당 5회를 세면서 넣으십시오.

**rate limit 자체는 e2e 로 검증하지 않습니다.** 유닛 테스트가 이미 덮고 있고, e2e 에서 한도를 소진시키면 같은 창 안의 다른 테스트가 줄줄이 무너집니다.

**스모크 테스트는 내용이 아니라 상태를 봅니다.** 홈은 아직 create-next-app 기본 화면입니다. 그 문구를 단언하면 실제 화면을 만드는 순간 깨집니다. 그래서 200 응답과 `main` 존재, 그리고 콘솔 에러 0건만 확인합니다.

## pnpm 빌드 승인 목록

`pnpm-workspace.yaml` 의 `onlyBuiltDependencies` 에 둘을 더했습니다.

- `@parcel/watcher` — Jest 가 `jest-haste-map` 을 통해 끌고 옵니다
- `@swc/core` — `@swc/jest` 가 끌고 옵니다

빠뜨리면 pnpm 이 설치 스크립트를 건너뛴 채 설치를 끝냅니다. 자세한 사정은 [monorepo.md](./monorepo.md) 를 보십시오.

## 타입 체크에 구멍이 있습니다

`pnpm typecheck` 는 `tsc -b` 이고, 루트 `tsconfig.json` 의 `references` 는 `packages/db` 만 가리킵니다. 즉 **`apps/web` 의 테스트 파일은 이 명령으로 타입 검사가 되지 않습니다.** 웹 쪽까지 보려면 따로 돌리십시오.

```bash
pnpm --filter @recipe-share/web exec tsc --noEmit
```

## 다음 후보

순수 로직부터 덮는 것이 여전히 비용 대비 효과가 큽니다. `storage.ts` 의 MIME·용량·매직넘버 검증이 다음 차례입니다. 라우트 핸들러는 DB 와 쿠키가 얽혀 있어 유닛으로 덮기보다 e2e 로 훑는 편이 쌉니다 — `recipes.spec.ts` 가 그 방식의 예시입니다.
