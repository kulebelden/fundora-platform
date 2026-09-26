import { MigrationInterface, QueryRunner } from 'typeorm';

export class CampaignUpdatesAndCover1730000003000 implements MigrationInterface {
  name = 'CampaignUpdatesAndCover1730000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "campaigns" ADD COLUMN "coverImageUrl" character varying(2048)`,
    );

    await queryRunner.query(`
      CREATE TABLE "campaign_updates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "campaignId" uuid NOT NULL,
        "title" character varying(200) NOT NULL,
        "content" text NOT NULL,
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campaign_updates" PRIMARY KEY ("id"),
        CONSTRAINT "FK_campaign_updates_campaignId" FOREIGN KEY ("campaignId")
          REFERENCES "campaigns"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_campaign_updates_campaignId" ON "campaign_updates" ("campaignId")`,
    );

    // The stats and per-campaign aggregates group settled intents by campaign.
    await queryRunner.query(`
      CREATE INDEX "IDX_payment_intents_campaign_status"
        ON "payment_intents" ("campaignId", "status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_payment_intents_campaign_status"`);
    await queryRunner.query(`DROP INDEX "IDX_campaign_updates_campaignId"`);
    await queryRunner.query(`DROP TABLE "campaign_updates"`);
    await queryRunner.query(`ALTER TABLE "campaigns" DROP COLUMN "coverImageUrl"`);
  }
}
