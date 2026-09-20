# 개발용 Docker 환경

최종 갱신: 2026-09-20

| 파일             | 역할                                        |
| ---------------- | ------------------------------------------- |
| `Dockerfile.dev` | 개발 전용 이미지 (운영은 루트 `Dockerfile`) |
| `compose.yaml`   | 서비스·볼륨·네트워크 정의                   |
| `.dockerignore`  | monorepo 경로로 갱신                        |

```bash
docker compose build
docker compose run --rm web pnpm --filter @recipe-share/db exec prisma migrate dev --name init
docker compose up
```

`http://localhost:3000` 으로 접속합니다.

`migrate dev`에 `--name init`을 붙인 이유가 있습니다. 이름을 주지 않으면 Prisma가 마이그레이션 이름을 대화형으로 물어보는데, `compose run`의 비대화형 환경에서는 그대로 멈춰버립니다.

**이 명령들은 monorepo 파일 이동이 끝난 뒤에야 동작합니다.** 아래 "지금 올리면 터지는 지점"을 먼저 보십시오.

## 지금 올리면 터지는 지점

파일 이동 전에 `docker compose build`를 돌리면 다음 순서로 실패합니다.

| 단계                                                      | 결과                                                                                    |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `COPY packages/db/package.json`                           | 통과 (파일 있음)                                                                        |
| `RUN pnpm install`                                        | 통과                                                                                    |
| `COPY . .`                                                | 통과                                                                                    |
| `RUN pnpm --filter @recipe-share/db exec prisma generate` | **실패.** 스키마가 아직 `prisma/schema.prisma`에 있고 `packages/db/prisma/`는 비어 있음 |

이걸 넘겨도 `next dev`가 `apps/web/src/app`을 찾지 못합니다. 현재 `apps/web/src`에는 `lib/db.ts`와 `lib/rate-limit.test.ts` 둘뿐입니다.

## 먼저 짚을 것 — DB가 SQLite입니다

요청하신 네 가지 중 "데이터베이스 연동"과 "네트워크 설정"은 이 프로젝트에서 보통의 경우와 다르게 풀립니다. `schema.prisma`의 provider가 `sqlite`이기 때문입니다.

SQLite은 서버가 아니라 **파일**입니다. 따라서 DB 컨테이너가 없고, 서비스 간 네트워크도 없습니다. 연동은 "어느 볼륨에 파일을 두느냐"의 문제가 되고, 네트워크 설정은 포트 퍼블리싱과 브리지 네트워크 선언까지입니다.

이것은 risk-analysis #1이 "나머지보다 먼저 결정돼야 할 근본 리스크"로 지목한 미결정 항목이기도 합니다. 이번에는 **변경 최소** 방침으로 SQLite을 유지했습니다. Postgres로 가기로 결정하시면 이 파일은 `db` 서비스 추가와 `DATABASE_URL` 교체로 확장되며, 그때 비로소 네트워크 설정이 의미를 갖습니다.

## 1. Hot reload

이 항목이 이 환경에서 가장 까다로운 부분이라 근거를 남깁니다.

**문제** — 프로젝트가 `C:\Users\...`에 있고 Docker Desktop은 WSL2를 씁니다. 이때 바인드 마운트는 9p/virtiofs를 거치는데, **이 경로로는 inotify 이벤트가 전달되지 않습니다.** 컨테이너 안의 파일 감시자는 호스트에서 파일을 고쳐도 아무 일도 일어나지 않은 것으로 봅니다. 화면이 갱신되지 않습니다.

**해결** — 감시자를 폴링으로 돌립니다. 그런데 여기서 갈림길이 생깁니다.

| 번들러                   | 폴링 방법                     | 상태                                                                                                                                  |
| ------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Turbopack (Next 16 기본) | `watchOptions.pollIntervalMs` | **16.3.5 공식 설정 목록에 없음.** 메인테이너가 이슈에서 언급했으나 문서화되지 않았고, Docker/WSL2에서 동작하지 않는다는 보고가 계속됨 |
| webpack                  | `WATCHPACK_POLLING=true`      | 오래 검증된 방식. `next dev --webpack` 플래그는 정식 문서에 있음                                                                      |

그래서 **개발 컨테이너는 `next dev --webpack` + `WATCHPACK_POLLING=true`로 띄웁니다.** Turbopack이 더 빠르지만, 이 환경에서 확실히 동작하는 쪽을 택했습니다.

`-H 0.0.0.0`은 넣지 않았습니다. Next 16의 `next dev`는 hostname 기본값이 이미 `0.0.0.0`입니다.

**폴링 없이 가는 길** — 저장소를 WSL2 리눅스 파일시스템(`\\wsl$\...` 아래) 으로 옮기면 inotify가 정상 동작합니다. 그러면 `--webpack`과 `WATCHPACK_POLLING`을 둘 다 빼고 Turbopack 기본값으로 훨씬 빠르게 쓸 수 있습니다. 가장 깔끔한 해법이지만 저장소 위치를 옮기는 일이라 기본값으로 삼지 않았습니다.

## 2. 데이터베이스 연동

SQLite 파일을 **바인드 마운트가 아니라 named volume(`db-data`)에 두고 `/data`로 마운트**합니다.

```yaml
environment:
  DATABASE_URL: file:/data/dev.db
volumes:
  - db-data:/data
```

소스와 함께 바인드 마운트 안에 두지 않은 이유가 있습니다. SQLite은 파일 잠금에 크게 의존하는데, 9p 같은 네트워크성 파일시스템 위에서는 잠금이 제대로 동작하지 않아 `database is locked`나 파일 손상이 발생할 수 있습니다. named volume은 컨테이너 내부의 정상적인 리눅스 파일시스템이라 이 문제가 없습니다.

대신 호스트에서 `dev.db`를 직접 열어볼 수는 없습니다. 필요하면 컨테이너를 통합니다.

```bash
docker compose exec web pnpm --filter @recipe-share/db exec prisma studio
docker compose cp web:/data/dev.db ./dev.db     # 호스트로 꺼내기
```

스키마를 고친 뒤에는 컨테이너 안에서 다시 돌려야 합니다.

```bash
docker compose exec web pnpm --filter @recipe-share/db exec prisma migrate dev --name <이름>
```

## 3. 볼륨 마운트

순서와 우선순위가 중요합니다. 뒤에 오는 마운트가 앞의 바인드 마운트를 덮습니다.

| 마운트                          | 목적                                                                |
| ------------------------------- | ------------------------------------------------------------------- |
| `.:/app`                        | 소스. 호스트 편집이 컨테이너로 전달되는 통로                        |
| `/app/node_modules`             | **익명 볼륨.** 호스트의 node_modules가 컨테이너 것을 덮지 않게 막음 |
| `/app/apps/web/node_modules`    | 위와 같음 (pnpm workspace는 패키지마다 node_modules를 가짐)         |
| `/app/packages/db/node_modules` | 위와 같음                                                           |
| `/app/apps/web/.next`           | 빌드 산출물. 호스트로 새면 느리고 OS 간 충돌이 남                   |
| `db-data:/data`                 | SQLite 파일                                                         |

익명 볼륨 세 줄이 핵심입니다. 이게 없으면 호스트의 `node_modules`(없거나, 윈도우에서 설치된 네이티브 바이너리)가 컨테이너 안의 리눅스용 설치본을 가려서, Prisma 엔진부터 깨집니다.

## 4. 네트워크

```yaml
ports:
  - '3000:3000'
networks:
  - recipe
```

```yaml
networks:
  recipe:
    driver: bridge
```

지금은 서비스가 `web` 하나라 브리지 네트워크에 실질적 역할이 없습니다. 명시적으로 선언해둔 이유는 나중에 `db`나 캐시 서비스를 붙일 때 서비스명으로 서로를 찾게 하기 위해서입니다. Compose 기본 네트워크에 맡겨도 동작은 같습니다.

Postgres를 붙이게 되면 이 절이 실질적인 내용을 갖게 됩니다. `web`이 `db:5432`로 접속하고, `db`는 `ports`를 열지 않아 호스트에 노출되지 않는 식입니다.

## 검증하지 못한 것

**소신은 이 구성을 실제로 실행해보지 못했습니다.** 이 세션의 컨테이너에 Docker가 없고, 폐하의 컴퓨터에서 명령을 돌릴 수단도 닿지 않았습니다. 확인한 것과 확인하지 못한 것을 구분해 적습니다.

| 항목                             | 상태                                            |
| -------------------------------- | ----------------------------------------------- |
| `compose.yaml` YAML 파싱         | 확인 (services·volumes·networks 키 정상)        |
| `next dev --webpack` 플래그 존재 | 확인 (Next 16.3.5 CLI 문서)                     |
| `-H` 기본값이 `0.0.0.0`          | 확인 (같은 문서)                                |
| Turbopack 폴링이 문서에 없음     | 확인 (16.3.5 config 목록에 `watchOptions` 부재) |
| 이미지 빌드 성공 여부            | **미확인**                                      |
| hot reload 실제 동작             | **미확인**                                      |
| Prisma 엔진이 alpine에서 뜨는지  | **미확인** (`openssl`, `libc6-compat`은 넣어둠) |

특히 첫 `docker compose up`은 monorepo 이동이 끝난 뒤에야 가능합니다. 이동 전에는 `apps/web/package.json`은 있어도 소스가 `src/`에 남아 있어 `next dev`가 뜨지 않습니다.

## 운영 Dockerfile은 아직 깨져 있습니다

루트 `Dockerfile`은 단일 패키지 기준이라 monorepo에서 동작하지 않습니다. 이번 작업 범위 밖이라 손대지 않았습니다. Node 20으로 고정되어 있는 점도 함께 올려야 합니다 (`pnpm test`가 22.18+ 필요). [progress.md](../progress/progress.md) 5절에 남겨두었습니다.
