# ShopHelp Web (Next.js standalone)
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter @shophelp/shared --filter @shophelp/web

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# NEXT_PUBLIC_* 在构建期固化，部署时传入公网 API 地址
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @shophelp/shared build && pnpm --filter @shophelp/web build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
ENV HOSTNAME=0.0.0.0 PORT=3000
CMD ["node", "apps/web/server.js"]
