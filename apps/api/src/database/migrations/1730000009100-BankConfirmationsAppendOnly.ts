import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bank-transfer confirmations are evidence, so like the ledger they are append-only.
 * Kept apart from the table's own migration because a fresh database gets its tables
 * from schema sync, which creates no triggers: scripts/bootstrap-db.js runs this one
 * on fresh databases too.
 */
export class BankConfirmationsAppendOnly1730000009100 implements MigrationInterface {
  name = 'BankConfirmationsAppendOnly1730000009100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE FUNCTION "bank_transfer_confirmations_immutable"() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'bank_transfer_confirmations is append-only';
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER "TRG_bank_transfer_confirmations_immutable"
        BEFORE UPDATE OR DELETE ON "bank_transfer_confirmations"
        FOR EACH ROW EXECUTE FUNCTION "bank_transfer_confirmations_immutable"()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER "TRG_bank_transfer_confirmations_immutable" ON "bank_transfer_confirmations"`,
    );
    await queryRunner.query(`DROP FUNCTION "bank_transfer_confirmations_immutable"()`);
  }
}
