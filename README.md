# claudes-sides

하위 프로젝트를 한 저장소에서 관리합니다.

```
claudes-sides/
├── online-shopping/  # Next.js + NestJS 쇼핑몰 모노레포
└── recipe-share/     # Next.js + Prisma 레시피 공유 서비스
```

두 폴더는 서브모듈이 아닌 일반 디렉터리입니다. 최상위에서 한 번에 커밋합니다.

## 커밋

```bash
git add .
git commit -m "feat: update projects"
```

## recipe-share 실행

```bash
cd recipe-share
docker compose up -d --build
```

브라우저에서 http://localhost:3000 을 엽니다.

종료:

```bash
docker compose down
```

## online-shopping 실행

```bash
cd online-shopping
pnpm install
pnpm dev
```
