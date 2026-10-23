# Build context: repository root (see deploy/docker-compose.prod.yml).
FROM node:20-bookworm-slim
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter "@fundora/api..."

COPY apps/api ./apps/api
RUN pnpm --filter @fundora/api build

WORKDIR /repo/apps/api
ENV NODE_ENV=production
EXPOSE 3000
# Prepare the database (schema on first run, then migrations), then start the API.
CMD ["sh", "-c", "node scripts/bootstrap-db.js && node dist/main.js"]
