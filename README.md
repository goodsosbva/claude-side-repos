# online-shop

온라인 쇼핑몰 모노레포 — pnpm workspace + Next.js + NestJS

## 구조

```
online-shop/
├── packages/
│   ├── web/           # Next.js frontend
│   │   ├── src/app/   # App Router pages
│   │   └── src/       # Components, styles
│   ├── api/           # NestJS backend
│   │   ├── src/       # Controllers, services, modules
│   │   └── test/      # API tests
│   ├── shared/        # Shared types & utilities
│   │   └── src/       # Interfaces, enums, helpers
│   └── ui/            # Shared React components
│       └── src/       # Reusable components
├── docker/            # Docker configuration
│   ├── web.Dockerfile
│   ├── api.Dockerfile
│   ├── docker-compose.yml
│   └── init.sql       # Database initialization
└── package.json       # Root workspace configuration
```

## 시작하기

```bash
cp .env.example .env
pnpm install
pnpm dev          # web(3000) + api(4000) 동시 실행
```

## Docker

```bash
pnpm docker:up    # postgres + api + web
pnpm docker:down
```
