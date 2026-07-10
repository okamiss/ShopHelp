# ShopHelp API (NestJS + Prisma)
FROM node:22-alpine
WORKDIR /app

RUN corepack enable

# 利用分层缓存：先装依赖
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter @shophelp/shared --filter @shophelp/api

# 源码 + 构建
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @shophelp/shared build && pnpm --filter @shophelp/api build

WORKDIR /app/apps/api
EXPOSE 3001
# 启动前执行 migrate deploy，保证 schema 就绪
CMD ["sh", "-c", "pnpm prisma:deploy && node dist/main.js"]
