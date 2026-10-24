/**
 * Container start-up step, run before the API (see apps/api/Dockerfile).
 *
 * The migrations assume tables already created by `schema:sync` (see README), so a
 * fresh database is first synced from the entities. Every migration except the
 * trigger-only ones (RUN_ON_FRESH_DATABASE) only builds schema that sync has now
 * produced, so those are recorded as applied; the trigger-only ones (the ledger and
 * bank-confirmation triggers) and any later migrations then run normally. An
 * existing database just gets pending migrations.
 * Campaign categories missing from the database are inserted on every start.
 */
const dataSource = require('../dist/database/data-source').default;
const { CATEGORIES } = require('../dist/database/categories');

// Schema sync creates no triggers, so the migrations that only add triggers still run.
const RUN_ON_FRESH_DATABASE = ['LedgerIntegrity1730000000000', 'BankConfirmationsAppendOnly1730000009100'];

async function main() {
  await dataSource.initialize();
  const [{ fresh }] = await dataSource.query(`SELECT to_regclass('public.users') IS NULL AS fresh`);

  if (fresh) {
    console.log('[bootstrap-db] Fresh database: creating schema from entities.');
    await dataSource.synchronize();
    await dataSource.query(
      `CREATE TABLE IF NOT EXISTS "migrations" ("id" SERIAL PRIMARY KEY, "timestamp" bigint NOT NULL, "name" character varying NOT NULL)`,
    );
    for (const migration of dataSource.migrations) {
      if (RUN_ON_FRESH_DATABASE.includes(migration.name)) continue;
      const timestamp = Number(migration.name.match(/(\d{13})$/)[1]);
      await dataSource.query(`INSERT INTO "migrations" ("timestamp", "name") VALUES ($1, $2)`, [
        timestamp,
        migration.name,
      ]);
    }
    // Seed row normally inserted by PlatformFeeAndCampaignArchive1730000007000.
    await dataSource.query(
      `INSERT INTO "platform_fee_changes" ("rate", "previousRate", "reason") VALUES (0.05, NULL, 'Initial platform fee')`,
    );
  }

  const applied = await dataSource.runMigrations({ transaction: 'each' });
  for (const migration of applied) console.log(`[bootstrap-db] Applied ${migration.name}`);

  for (const category of CATEGORIES) {
    const inserted = await dataSource.query(
      `INSERT INTO "campaign_categories" ("name", "slug", "description") VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING RETURNING "slug"`,
      [category.name, category.slug, category.description],
    );
    if (inserted.length) console.log(`[bootstrap-db] Added category ${category.slug}`);
  }
  await dataSource.destroy();
}

main().catch((error) => {
  console.error('[bootstrap-db] Failed:', error);
  process.exit(1);
});
