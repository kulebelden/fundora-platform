import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Two super-admin controls:
 *
 * - An editable platform fee. Every change is a new row in `platform_fee_changes`
 *   (the current fee is the newest row), so the fee's whole history doubles as
 *   its audit trail. Each payment intent snapshots the rate it was quoted at, so
 *   a change made while a donation is in flight never alters what that donor
 *   was shown.
 * - Archiving ("deleting") a campaign. Ledger entries are immutable, so a
 *   campaign that ever took money cannot be removed; `deletedAt` hides it from
 *   every page while its financial history stays intact.
 */
export class PlatformFeeAndCampaignArchive1730000007000 implements MigrationInterface {
  name = 'PlatformFeeAndCampaignArchive1730000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "platform_fee_changes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "rate" numeric(6,4) NOT NULL,
        "previousRate" numeric(6,4),
        "reason" character varying(500) NOT NULL,
        "changedById" uuid,
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_platform_fee_changes" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_platform_fee_changes_rate" CHECK ("rate" >= 0 AND "rate" <= 0.25),
        CONSTRAINT "FK_platform_fee_changes_changedById_users"
          FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_platform_fee_changes_created_at" ON "platform_fee_changes" ("createdAt" DESC)`,
    );
    // The rate that was hard-coded until now, so history starts from a known point.
    await queryRunner.query(
      `INSERT INTO "platform_fee_changes" ("rate", "previousRate", "reason") VALUES (0.05, NULL, 'Initial platform fee')`,
    );

    // Nullable: intents created before this column existed were quoted at 5%,
    // which the ledger falls back to.
    await queryRunner.query(`ALTER TABLE "payment_intents" ADD "platformFeeRate" numeric(6,4)`);

    await queryRunner.query(`ALTER TABLE "campaigns" ADD "deletedAt" timestamp with time zone`);
    await queryRunner.query(`ALTER TABLE "campaigns" ADD "deletedById" uuid`);
    await queryRunner.query(`ALTER TABLE "campaigns" ADD "deletionReason" character varying(500)`);
    await queryRunner.query(`
      ALTER TABLE "campaigns"
        ADD CONSTRAINT "FK_campaigns_deletedById_users"
        FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "campaigns" DROP CONSTRAINT "FK_campaigns_deletedById_users"`);
    await queryRunner.query(`ALTER TABLE "campaigns" DROP COLUMN "deletionReason"`);
    await queryRunner.query(`ALTER TABLE "campaigns" DROP COLUMN "deletedById"`);
    await queryRunner.query(`ALTER TABLE "campaigns" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "payment_intents" DROP COLUMN "platformFeeRate"`);
    await queryRunner.query(`DROP INDEX "IDX_platform_fee_changes_created_at"`);
    await queryRunner.query(`DROP TABLE "platform_fee_changes"`);
  }
}
