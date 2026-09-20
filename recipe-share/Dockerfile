# risk-analysis.md #1·#2 대응: SQLite 파일과 업로드물이 휘발되지 않도록
# "영구 파일시스템이 있는 단일 컨테이너" 전제로 만든 이미지입니다.
# 서버리스(Vercel 등)로 갈 경우 이 Dockerfile이 아니라 DB/스토리지 결정부터 다시 해야 합니다.

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- 의존성 ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- 빌드 ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate && pnpm build

# ---- 런타임 ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# standalone 트레이싱이 Prisma 엔진을 놓치는 경우가 있어 명시적으로 복사
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000

# 이 두 경로는 반드시 볼륨으로 마운트할 것 — 안 하면 재배포 시 DB와 업로드 이미지가 사라짐
VOLUME ["/app/prisma", "/app/public/uploads"]

CMD ["node", "server.js"]
