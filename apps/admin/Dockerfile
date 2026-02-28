FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat icu-libs icu-data-full tzdata

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/package.json ./apps/admin/package.json

RUN corepack enable && pnpm install --no-frozen-lockfile --filter admin...

COPY apps/admin ./apps/admin

WORKDIR /app/apps/admin
RUN corepack enable && pnpm run build

FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat icu-libs icu-data-full tzdata

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3001
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV TZ=Asia/Ho_Chi_Minh

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/admin ./apps/admin

WORKDIR /app/apps/admin

EXPOSE 3001

CMD ["sh", "-lc", "corepack enable && pnpm run start -- -H 0.0.0.0 -p 3001"]
