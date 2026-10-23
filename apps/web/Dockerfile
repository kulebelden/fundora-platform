# Build context: repository root (see deploy/docker-compose.prod.yml).
FROM node:20-bookworm-slim
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter "@fundora/web..."

COPY apps/web ./apps/web
# Rewrites are baked into the build, so the API's in-network address is needed here.
ARG API_ORIGIN=http://api:3000
ENV API_ORIGIN=$API_ORIGIN \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=1536
RUN pnpm --filter @fundora/web build

WORKDIR /repo/apps/web
ENV NODE_OPTIONS=
EXPOSE 3001
CMD ["./node_modules/.bin/next", "start", "-p", "3001"]
