import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sign-up now requires confirming the email address before the first login.
 * Accounts that already exist are marked verified, so nobody who could sign in
 * yesterday is locked out today.
 */
export class EmailVerification1730000008000 implements MigrationInterface {
  name = 'EmailVerification1730000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "email_verification_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "tokenHash" character varying(64) NOT NULL,
        "expiresAt" timestamp with time zone NOT NULL,
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_verification_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_email_verification_tokens_userId_users"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_email_verification_tokens_token_hash" ON "email_verification_tokens" ("tokenHash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_email_verification_tokens_user_id" ON "email_verification_tokens" ("userId")`,
    );
    await queryRunner.query(`UPDATE "users" SET "isEmailVerified" = true WHERE "isEmailVerified" = false`);
  }

  /** Leaves `isEmailVerified` as is: there is no record of which rows the up step changed. */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_email_verification_tokens_user_id"`);
    await queryRunner.query(`DROP INDEX "UQ_email_verification_tokens_token_hash"`);
    await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
  }
}
