# docs

최종 갱신: 2026-09-20

```
docs/
├─ design/      설계 원본 — 이번 작업의 근거가 된 문서
├─ setup/       구성 설명 — 무엇을 어떻게 셋팅했는가
└─ progress/    진행 설명 — 어디까지 했고 뭐가 남았는가
```

## 급한 것부터

| 알고 싶은 것                      | 문서                                                       |
| --------------------------------- | ---------------------------------------------------------- |
| **지금 당장 뭘 해야 하는가**      | [progress/progress.md](./progress/progress.md) 4절         |
| MVP가 어디까지 구현됐는가         | [progress/mvp.md](./progress/mvp.md)                       |
| monorepo를 어떻게 짰는가          | [setup/monorepo.md](./setup/monorepo.md)                   |
| VS Code 설정이 어떻게 되어 있는가 | [setup/vscode.md](./setup/vscode.md)                       |
| 테스트를 어떻게 돌리는가          | [setup/testing.md](./setup/testing.md)                     |
| 로컬 k8s로 띄워 보기              | [../k8s/README.md](../k8s/README.md)                       |
| 커밋할 때 뭐가 검사되는가         | [setup/git-hooks.md](./setup/git-hooks.md)                 |
| Docker로 개발 환경 띄우기         | [setup/docker-dev.md](./setup/docker-dev.md)               |
| 파일이 어디에 있는가              | [progress/file-structure.md](./progress/file-structure.md) |
| 보안에 문제가 없는가              | [setup/dependency-audit.md](./setup/dependency-audit.md)   |

## design — 설계 원본

이번 작업이 근거로 삼은 원본 문서입니다. 작업 중 수정하지 않았습니다.

| 문서                                          | 내용                                                       |
| --------------------------------------------- | ---------------------------------------------------------- |
| [architecture.md](./design/architecture.md)   | 전체 구조·인증 흐름 다이어그램, 레이어별 책임, 확장 포인트 |
| [feature-spec.md](./design/feature-spec.md)   | MVP 기능 명세 F01~F14, 우선순위와 예상 공수                |
| [risk-analysis.md](./design/risk-analysis.md) | 설계 단계 리스크 8건과 대응 방안                           |

## setup — 구성 설명

무엇을 어떻게 셋팅했고, 왜 그렇게 했는지입니다.

| 문서                                               | 내용                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [monorepo.md](./setup/monorepo.md)                 | pnpm workspace 구성, 루트/패키지 의존성 배치 기준, `workspace:*` 연결, TS 프로젝트 레퍼런스 |
| [vscode.md](./setup/vscode.md)                     | 추천 익스텐션, 디버깅 구성, 태스크, 코드 스니펫                                             |
| [testing.md](./setup/testing.md)                   | Jest·React Testing Library·Playwright 구성, 커버리지 래칫, e2e DB 분리                      |
| [git-hooks.md](./setup/git-hooks.md)               | core.hooksPath 기반 훅 3종 — 린트·커밋 메시지·테스트                                        |
| [docker-dev.md](./setup/docker-dev.md)             | 개발용 compose — hot reload, SQLite 볼륨, 마운트, 네트워크                                  |
| [dependency-audit.md](./setup/dependency-audit.md) | 보안 취약점, 업데이트 가능 목록, 버전 충돌, 불필요한 의존성                                 |

## progress — 진행 설명

어디까지 왔고, 무엇이 남았는지입니다.

| 문서                                              | 내용                                          |
| ------------------------------------------------- | --------------------------------------------- |
| [progress.md](./progress/progress.md)             | 수행한 작업, 남은 일, **실행해야 할 명령**    |
| [file-structure.md](./progress/file-structure.md) | 현재 디스크 상태(전환 중) + 이동 후 목표 구조 |

## 현재 상태

저장소는 **전환 중간 상태**입니다. 실행이 필요한 것이 두 가지 남아 있습니다.

1. monorepo 파일 이동 — 하기 전까지 `pnpm install`·`pnpm build`·`pnpm test`가 동작하지 않습니다
2. `vscode-setup/` → `.vscode/` 이동 — 하기 전까지 에디터 설정이 적용되지 않습니다

두 명령 모두 [progress/progress.md](./progress/progress.md) 4절에 있습니다.

git 훅(`.githooks/`)은 제자리에 있으나, 이동 전까지는 `pnpm lint`·`pnpm test`가 실패하므로 커밋과 푸시를 막습니다. [setup/git-hooks.md](./setup/git-hooks.md) 참고.
