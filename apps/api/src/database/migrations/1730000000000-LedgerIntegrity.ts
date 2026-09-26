import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Database-level guarantees for the double-entry ledger. Application code can have bugs;
 * these triggers make an unbalanced or mutated ledger impossible to commit.
 *
 * Requires the ledger tables to exist first (run `schema:sync` on a fresh database).
 */
export class LedgerIntegrity1730000000000 implements MigrationInterface {
  name = 'LedgerIntegrity1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Every transaction's entries must sum to exactly zero at COMMIT time.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION ledger_assert_balanced() RETURNS trigger AS $$
      DECLARE
        total NUMERIC;
      BEGIN
        SELECT COALESCE(SUM("amount"), 0) INTO total
          FROM "ledger_entries" WHERE "transactionId" = NEW."transactionId";
        IF total <> 0 THEN
          RAISE EXCEPTION 'Ledger transaction % is unbalanced (sum = %)', NEW."transactionId", total
            USING ERRCODE = '23514';
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE CONSTRAINT TRIGGER "TRG_ledger_entries_balanced"
        AFTER INSERT ON "ledger_entries"
        DEFERRABLE INITIALLY DEFERRED
        FOR EACH ROW EXECUTE FUNCTION ledger_assert_balanced();
    `);

    // 2. Entries are append-only; corrections are made with reversing transactions.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION ledger_entries_immutable() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'ledger_entries is append-only (% blocked)', TG_OP
          USING ERRCODE = '55000';
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER "TRG_ledger_entries_immutable"
        BEFORE UPDATE OR DELETE ON "ledger_entries"
        FOR EACH ROW EXECUTE FUNCTION ledger_entries_immutable();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS "TRG_ledger_entries_immutable" ON "ledger_entries"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS ledger_entries_immutable()`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS "TRG_ledger_entries_balanced" ON "ledger_entries"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS ledger_assert_balanced()`);
  }
}
