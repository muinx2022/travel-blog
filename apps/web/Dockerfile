FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat icu-libs icu-data-full tzdata

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json

RUN corepack enable && pnpm install --no-frozen-lockfile --filter web...

COPY apps/web ./apps/web

WORKDIR /app/apps/web
RUN corepack enable && pnpm run build

FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat icu-libs icu-data-full tzdata

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV TZ=Asia/Ho_Chi_Minh

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web ./apps/web

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["sh", "-lc", "corepack enable && pnpm run start -- -H 0.0.0.0 -p 3000"]
