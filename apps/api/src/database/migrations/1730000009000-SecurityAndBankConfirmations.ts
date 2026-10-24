import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - Account lockout after repeated failed logins, and `passwordChangedAt` so a
 *   password reset ends every session issued before it.
 * - Password reset links (only the SHA-256 of each token is stored).
 * - Manual bank-transfer confirmations: an append-only record of which staff member
 *   marked which transfer as received, against which bank reference. A bank reference
 *   can be used once, so one transfer can never credit two donations. Its append-only
 *   trigger is in BankConfirmationsAppendOnly1730000009100.
 */
export class SecurityAndBankConfirmations1730000009000 implements MigrationInterface {
  name = 'SecurityAndBankConfirmations1730000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "failedLoginCount" integer NOT NULL DEFAULT 0,
        ADD COLUMN "lockedUntil" timestamp with time zone,
        ADD COLUMN "passwordChangedAt" timestamp with time zone
    `);

    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "tokenHash" character varying(64) NOT NULL,
        "expiresAt" timestamp with time zone NOT NULL,
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_password_reset_tokens_userId_users"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_password_reset_tokens_token_hash" ON "password_reset_tokens" ("tokenHash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_user_id" ON "password_reset_tokens" ("userId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "bank_transfer_confirmations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "paymentIntentId" uuid NOT NULL,
        "bankReference" character varying(64) NOT NULL,
        "amountReceived" numeric(20,4) NOT NULL,
        "currency" character(3) NOT NULL,
        "receivedOn" date NOT NULL,
        "note" text,
        "confirmedBy" uuid NOT NULL,
        "confirmedByEmail" character varying(255) NOT NULL,
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bank_transfer_confirmations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_bank_transfer_confirmations_payment_intent" UNIQUE ("paymentIntentId"),
        CONSTRAINT "UQ_bank_transfer_confirmations_bank_reference" UNIQUE ("bankReference"),
        CONSTRAINT "CHK_bank_transfer_confirmations_amount_positive" CHECK ("amountReceived" > 0),
        CONSTRAINT "FK_bank_transfer_confirmations_payment_intent"
          FOREIGN KEY ("paymentIntentId") REFERENCES "payment_intents"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_bank_transfer_confirmations_confirmed_by"
          FOREIGN KEY ("confirmedBy") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_bank_transfer_confirmations_created_at" ON "bank_transfer_confirmations" ("createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "bank_transfer_confirmations"`);
    await queryRunner.query(`DROP INDEX "IDX_password_reset_tokens_user_id"`);
    await queryRunner.query(`DROP INDEX "UQ_password_reset_tokens_token_hash"`);
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "passwordChangedAt",
        DROP COLUMN "lockedUntil",
        DROP COLUMN "failedLoginCount"
    `);
  }
}
