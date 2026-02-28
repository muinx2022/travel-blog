FROM node:20-alpine

RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

RUN corepack enable && pnpm install --no-frozen-lockfile --filter api...

COPY apps/api ./apps/api

WORKDIR /app/apps/api
RUN corepack enable && pnpm run build

EXPOSE 1337

CMD ["sh", "-lc", "corepack enable && pnpm run start"]
