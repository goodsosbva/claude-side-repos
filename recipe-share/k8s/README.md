# 로컬 k8s 테스트 환경

`compose.yaml` 과 같은 것을 쿠버네티스로 옮긴 것이다. 운영용이 아니다 —
로컬 클러스터(Docker Desktop / kind / minikube)에서 파드·볼륨·서비스가
제대로 붙는지 확인하는 용도다.

## 구성

| 파일 | 내용 |
| --- | --- |
| `namespace.yaml` | `recipe-share` 네임스페이스 |
| `configmap.yaml` | 비밀이 아닌 환경변수 (`DATABASE_URL`, `JWT_EXPIRES_IN` 등) |
| `secret.yaml` | `JWT_SECRET`. 로컬 전용 더미값이 들어 있다 |
| `pvc.yaml` | SQLite 파일용 1Gi, 업로드 이미지용 2Gi |
| `deployment.yaml` | initContainer(`prisma db push`) + `next dev` 컨테이너 |
| `service.yaml` | ClusterIP + NodePort(30300) |
| `kustomization.yaml` | 위 전부를 묶은 kustomize 진입점 |

## 전제

운영 `Dockerfile` 은 monorepo 전환 전 경로(`/app/prisma`, `/app/public`)를
그대로 쓰고 있어 아직 빌드가 되지 않는다. 그래서 이 매니페스트는
**`Dockerfile.dev` 로 만든 `recipe-share:dev` 이미지**를 쓴다.
운영 이미지가 고쳐지면 `deployment.yaml` 의 `image` 와 `command` 를
`node server.js` 기준으로 바꾸면 된다.

`Dockerfile.dev` 에는 `CMD` 가 없다(compose 가 `command` 를 주입하는 구조).
그래서 Deployment 에서 `command` 를 명시한다. 지우면 파드가 즉시 죽는다.

## 실행

### 1) 이미지 빌드

```bash
docker build -f Dockerfile.dev -t recipe-share:dev .
```

### 2) 클러스터에 이미지 올리기

Docker Desktop 의 쿠버네티스는 같은 이미지 저장소를 보므로 추가 작업이 없다.

```bash
# kind 를 쓰는 경우
kind load docker-image recipe-share:dev

# minikube 를 쓰는 경우
minikube image load recipe-share:dev
```

### 3) 배포

```bash
kubectl apply -k k8s/
kubectl -n recipe-share rollout status deploy/recipe-share-web
```

첫 기동은 `next dev` 가 최초 요청을 컴파일하는 시간 때문에 오래 걸린다.
startupProbe 에 최대 5분을 잡아 두었다.

### 4) 접속

```bash
# NodePort
open http://localhost:30300

# 또는 port-forward
kubectl -n recipe-share port-forward svc/recipe-share-web 3000:3000
```

### 5) 정리

```bash
kubectl delete -k k8s/
# PVC 까지 지우려면 (DB 와 업로드물이 사라진다)
kubectl delete ns recipe-share
```

## 확인할 것들

```bash
kubectl -n recipe-share get pod,pvc,svc
kubectl -n recipe-share logs deploy/recipe-share-web -c prisma-db-push
kubectl -n recipe-share logs -f deploy/recipe-share-web
```

## 알아 둘 점

**`db push` 를 쓰는 이유.** `packages/db/prisma` 에 `migrations/` 디렉터리가
아직 없다. 그래서 initContainer 는 `prisma migrate deploy` 가 아니라
`prisma db push --skip-generate` 로 스키마를 밀어 넣는다. 마이그레이션
파일을 만들고 나면 그 자리를 `migrate deploy` 로 바꾸는 것이 맞다.

**`replicas: 1` 과 `strategy: Recreate`.** SQLite 는 단일 라이터이고 PVC 도
`ReadWriteOnce` 다. 롤링 업데이트로 두면 새 파드가 같은 볼륨을 붙지 못해
`Pending` 에 걸린다. 스케일 아웃이 필요해지면 그때는 매니페스트가 아니라
DB 를 먼저 바꿔야 한다(`schema.prisma` 의 provider 주석 참고).

**핫 리로드는 없다.** 소스가 이미지 안에 구워져 있다. 코드를 고치면 다시
빌드하고 `kubectl rollout restart deploy/recipe-share-web` 를 해야 한다.
코드를 고쳐 가며 작업할 때는 이쪽이 아니라 `docker compose up` 을 쓰는 것이 낫다.

**`JWT_SECRET` 교체.**

```bash
kubectl -n recipe-share create secret generic recipe-share-secret \
  --from-literal=JWT_SECRET="$(openssl rand -hex 48)" \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n recipe-share rollout restart deploy/recipe-share-web
```
