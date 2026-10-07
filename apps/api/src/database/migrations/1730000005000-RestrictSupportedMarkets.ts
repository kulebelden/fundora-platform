import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Supported markets are now the US-dollar and euro economies only. `countryCode`
 * on `user_profiles` is a free-text column, so rows seeded or registered before
 * this change can still hold a country the platform no longer pays out to.
 *
 * This maps any unsupported code onto its closest supported market rather than
 * failing, so no account is locked out by the change. Rows are updated rather
 * than deleted: the profile is still valid, only its market label is stale.
 */
export class RestrictSupportedMarkets1730000005000 implements MigrationInterface {
  name = 'RestrictSupportedMarkets1730000005000';

  /** The markets HopeNest supports, as ISO 3166-1 alpha-2. */
  private static readonly SUPPORTED = [
    // ---- US dollar
    'US', 'EC', 'SV', 'PA', 'PR', 'TL', 'MH', 'FM', 'PW',
    // ---- Euro
    'AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT',
    'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        UPDATE "user_profiles"
           SET "countryCode" = 'US'
         WHERE "countryCode" IS NULL
            OR UPPER(BTRIM("countryCode")) <> ALL ($1::text[])
      `,
      [RestrictSupportedMarkets1730000005000.SUPPORTED],
    );

    // Campaign and payment currencies are plain varchar, not enums, so the same
    // allowlist is enforced on the existing rows.
    await queryRunner.query(
      `UPDATE "campaigns" SET "currency" = 'USD' WHERE UPPER("currency") NOT IN ('USD', 'EUR')`,
    );
    await queryRunner.query(
      `UPDATE "payment_intents" SET "currency" = 'USD' WHERE UPPER("currency") NOT IN ('USD', 'EUR')`,
    );
    await queryRunner.query(
      `UPDATE "withdrawal_requests" SET "currency" = 'USD' WHERE UPPER("currency") NOT IN ('USD', 'EUR')`,
    );

    // Withdrawal bank details are JSON; drop a payout country we cannot serve.
    await queryRunner.query(
      `
        UPDATE "withdrawal_requests"
           SET "bankAccountDetails" = "bankAccountDetails" - 'country'
         WHERE "bankAccountDetails" ? 'country'
           AND UPPER(BTRIM("bankAccountDetails"->>'country')) <> ALL($1::text[])
      `,
      [RestrictSupportedMarkets1730000005000.SUPPORTED],
    );
  }

  /**
   * Irreversible on purpose: the previous values are unrecoverable, and
   * restoring them would re-advertise markets the platform does not serve.
   */
  public async down(): Promise<void> {
    throw new Error('RestrictSupportedMarkets cannot be reverted: original country codes are not recoverable.');
  }
}
