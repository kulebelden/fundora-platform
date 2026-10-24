import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Campaign creation never opened a wallet row (only the seed script did), so
 * donations to app-created campaigns could not be credited and payouts could not
 * be debited. Opens a zero-balance wallet for every campaign that lacks one;
 * CampaignsService.createCampaign now opens it at creation.
 */
export class BackfillCampaignWallets1730000009200 implements MigrationInterface {
  name = 'BackfillCampaignWallets1730000009200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "campaign_wallets" ("campaignId")
      SELECT c."id" FROM "campaigns" c
       WHERE NOT EXISTS (SELECT 1 FROM "campaign_wallets" w WHERE w."campaignId" = c."id")
    `);
  }

  /** Nothing to undo safely: a wallet may have balances by now. */
  public async down(): Promise<void> {}
}
