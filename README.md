# Fundora Platform

Crowdfunding infrastructure: NestJS API, Next.js web, PostgreSQL 16, Redis 7.

```
apps/api         NestJS + TypeORM (ledger, campaigns, identity, payments)
apps/web         Next.js
packages/types   shared TypeScript types
packages/config  shared tsconfig
```

## Quick start

Requires Node >= 20, pnpm >= 9, Docker.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env      # PowerShell: Copy-Item apps/api/.env.example apps/api/.env
docker compose up -d                        # Postgres :5432, Redis :6379 (wait until healthy)

pnpm db:sync        # create tables from entities (fresh dev database)
pnpm db:migrate     # install ledger integrity triggers (balanced + append-only)

pnpm dev:api        # http://localhost:3000
pnpm dev:web        # http://localhost:3001
```

`db:migrate` must run after `db:sync` on a fresh database because the migration attaches
triggers to `ledger_entries`. Before production, replace `db:sync` with a generated baseline
migration (`pnpm --filter @fundora/api typeorm migration:generate src/database/migrations/Baseline`,
timestamped before the LedgerIntegrity migration).

## Financial invariants

- Money is `NUMERIC(20,4)` in Postgres and a decimal **string** in TypeScript. Never a `number`.
- Ledger entries use signed amounts (DEBIT > 0, CREDIT < 0); a deferred trigger rejects any
  transaction whose entries do not sum to zero, and entries cannot be updated or deleted.
- `PaymentIntent.amount` is set server-side; webhooks never supply it.
- `ProcessedWebhook.providerEventId` is the primary key: insert it in the same DB transaction as the
  ledger posting, and treat a conflict as "already processed".
