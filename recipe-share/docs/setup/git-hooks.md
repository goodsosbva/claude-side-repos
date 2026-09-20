# Git 훅 설정

최종 갱신: 2026-09-20

## 결론: 훅 배선에는 의존성 0개

husky도 lint-staged도 commitlint도 넣지 않았습니다. (포맷터는 Prettier를 씁니다.) git 내장 기능인 **`core.hooksPath`** 로 `.githooks/` 디렉터리를 가리키게 했습니다.

husky가 하는 일이 정확히 이것입니다. 패키지 3개와 `node_modules` 의존성을 더할 이유가 없습니다.

| 파일                   | 시점           | 하는 일                     |
| ---------------------- | -------------- | --------------------------- |
| `.githooks/pre-commit` | 커밋 직전      | Prettier + 공백 검사 + 린트 |
| `.githooks/commit-msg` | 메시지 작성 후 | Conventional Commits 검증   |
| `.githooks/pre-push`   | 푸시 직전      | 테스트 실행                 |

## 설치

루트 `package.json`에 `prepare` 스크립트를 넣었으므로 **`pnpm install` 시 자동으로 연결됩니다.**

```json
"prepare": "git config core.hooksPath .githooks || true"
```

`|| true`를 붙인 이유는 `.git`이 없는 환경(Docker 빌드, CI)에서 설치가 실패하지 않게 하기 위해서입니다.

수동으로 할 경우:

```bash
git config core.hooksPath .githooks
git update-index --chmod=+x .githooks/pre-commit .githooks/commit-msg .githooks/pre-push
```

두 번째 줄은 실행 권한을 git 인덱스에 기록합니다. Windows에서는 Git Bash가 `sh`로 실행하므로 없어도 동작하지만, macOS·Linux 팀원에게는 필요합니다.

## 1. pre-commit — 포맷팅 체크와 린트

세 단계를 순서대로 돌립니다.

**(1) Prettier** — `pnpm format:check`

`.prettierrc`는 두 줄뿐입니다.

```json
{
  "singleQuote": true,
  "printWidth": 100
}
```

나머지는 Prettier 기본값이 이미 이 저장소 스타일과 같아서 적지 않았습니다 (`semi: true`, `tabWidth: 2`, `trailingComma: "all"`). 두 값을 뒤집은 근거는 실제 소스를 세어본 결과입니다.

| 파일                       | 홑따옴표 | 겹따옴표 | 최장 줄 |
| -------------------------- | -------- | -------- | ------- |
| `lib/rate-limit.ts`        | 8        | 0        | 116     |
| `lib/auth.ts`              | 18       | 0        | 133     |
| `components/ui/button.tsx` | 28       | 0        | 158     |
| `api/auth/login/route.ts`  | 24       | 0        | 109     |
| `app/layout.tsx`           | 0        | 24       | —       |

홑따옴표가 압도적이라 `singleQuote: true`로 맞췄습니다. 겹따옴표를 쓰는 `layout.tsx`는 create-next-app 원본 파일입니다. `printWidth`는 기본값이 80인데 위 표대로 100~158자 줄이 흔해서, 80으로 두면 거의 전부가 재줄바꿈됩니다. 100이 타협점입니다.

**(2) `git diff --cached --check`** — Prettier가 다루지 못하는 파일의 공백 검사

Prettier는 `Dockerfile`, `schema.prisma`, `.env.example`, `.gitignore`를 포맷하지 않습니다. 이 한 줄이 그 파일들의 후행 공백과 탭 혼용을 잡습니다. 비용이 없으므로 남겨두었습니다.

**(3) `pnpm lint`** — 스테이징된 파일에 `.ts/.tsx/.js/.jsx/.mjs`가 있을 때만

루트 flat config 하나가 `apps/*`와 `packages/*`를 모두 덮습니다. 근거는 [monorepo.md](./monorepo.md) 1-1절에 있습니다.

### eslint-config-prettier는 넣지 않았습니다

보통 ESLint와 Prettier를 함께 쓰면 규칙 충돌을 끄려고 이 패키지를 답니다. 이 저장소에는 필요 없습니다. `eslint-config-next`(= `next/core-web-vitals` + `next/typescript`)는 들여쓰기·따옴표 같은 스타일 규칙을 켜지 않기 때문입니다. 충돌할 규칙이 없으니 끌 것도 없습니다.

나중에 스타일 규칙이 있는 config를 추가하게 되면 그때 넣으면 됩니다.

> **알려진 한계** — 스테이징된 파일만이 아니라 저장소 전체를 검사합니다. 스테이징 단위로 넘기려면 파일명 이스케이프 처리가 필요하고, 그걸 대신해주는 게 lint-staged입니다. 지금은 파일이 적어 전체 검사가 빠르므로 넣지 않았습니다. 훅 안에 `ponytail:` 주석으로 표시해두었습니다.

### 처음 한 번은 대량 변경이 납니다

Prettier를 새로 도입하면 첫 실행에서 기존 파일 대부분이 재포맷됩니다. 이건 피할 수 없으니, **포맷만 하는 커밋을 따로 만드십시오.** 진짜 변경과 섞이면 diff에서 구분이 안 됩니다.

```bash
pnpm format
git add -A
git commit -m "style: Prettier 도입에 따른 전체 포맷" --no-verify
```

**주의** — 소신이 이 컨테이너에서 Prettier를 설치할 수 없어(npm 레지스트리 차단) 실제로 몇 개 파일이 바뀌는지는 확인하지 못했습니다. 위 설정은 측정한 스타일로 churn을 줄인 것일 뿐 검증된 수치가 아니니, `pnpm format` 후 diff를 한 번 훑어보십시오.

## 2. commit-msg — 커밋 메시지 규칙

Conventional Commits를 sh 정규식으로 검증합니다. commitlint와 그 설정 파일이 필요 없습니다.

```
<type>(<scope>)!: <subject>
```

| 요소      | 규칙                                                                                    |
| --------- | --------------------------------------------------------------------------------------- |
| `type`    | `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` 중 하나, 필수 |
| `scope`   | 선택. 소문자·숫자·`/._-` (예: `auth`, `recipes`, `db/prisma`)                           |
| `!`       | 선택. 호환성이 깨지는 변경 표시                                                         |
| `subject` | 1~72자, 필수                                                                            |

```
feat(auth): 로그인 rate limit 추가
fix(recipes): PUT에서 소유권 검증 누락 수정
chore!: pnpm workspace로 전환
```

`Merge`·`Revert`·`fixup!`·`squash!`로 시작하는 메시지는 git이 자동 생성하므로 검사하지 않습니다. `#`으로 시작하는 주석 줄과 빈 줄은 건너뛰고 첫 실제 줄을 제목으로 봅니다.

거부되면 형식·예시와 함께 받은 값을 그대로 출력합니다.

**검증 결과** — 유효 8건(한글 제목, 스코프, `!`, 슬래시 스코프, merge/revert, 72자 경계), 무효 8건(타입 없음, 콜론 없음, 대문자 타입, 미등록 타입 `wip`, 대문자 스코프, 빈 제목, 73자 초과) **총 16건 전부 기대대로 동작**했습니다.

## 3. pre-push — 테스트

```sh
pnpm test
```

테스트 러너는 [testing.md](./testing.md)를 보십시오. 매치되는 테스트 파일이 없어도 오류 없이 통과하므로, 테스트가 없는 패키지가 푸시를 막지는 않습니다.

## 지금은 훅이 통과하지 못합니다

저장소가 전환 중간 상태라 `pnpm lint`와 `pnpm test`가 아직 동작하지 않습니다. 따라서 **pre-commit과 pre-push는 현재 모든 커밋과 푸시를 막습니다.**

[progress.md](../progress/progress.md) 4절의 이동 명령을 먼저 실행하십시오. 그 전에 커밋해야 한다면 `--no-verify`를 쓰십시오.

## 우회

```bash
git commit --no-verify
git push --no-verify
```

긴급 상황용입니다. 훅을 일상적으로 우회하게 된다면 훅이 잘못된 것이므로, 우회 대신 훅을 고치십시오.
