import { MigrationInterface, QueryRunner } from 'typeorm';

export class WithdrawalsAndKyc1730000002000 implements MigrationInterface {
  name = 'WithdrawalsAndKyc1730000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "kyc_status" AS ENUM ('NOT_STARTED', 'SUBMITTED', 'VERIFIED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "withdrawal_status" AS ENUM ('REQUESTED', 'PENDING_REVIEW', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED')`,
    );

    await queryRunner.query(`
      CREATE TABLE "kyc_profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "nationalIdOrPassport" character varying(64) NOT NULL,
        "documentUrl" character varying(2048) NOT NULL,
        "status" "kyc_status" NOT NULL DEFAULT 'NOT_STARTED',
        "rejectionReason" text,
        "reviewedBy" uuid,
        "verifiedAt" timestamp with time zone,
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_kyc_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_kyc_profiles_userId" UNIQUE ("userId"),
        CONSTRAINT "FK_kyc_profiles_userId_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "withdrawal_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "campaignId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "grossAmount" numeric(20,4) NOT NULL,
        "serviceFee" numeric(20,4) NOT NULL,
        "netAmount" numeric(20,4) NOT NULL,
        "currency" character(3) NOT NULL,
        "bankAccountDetails" jsonb NOT NULL,
        "status" "withdrawal_status" NOT NULL DEFAULT 'REQUESTED',
        "rejectionReason" text,
        "reviewedBy" uuid,
        "reviewedAt" timestamp with time zone,
        "payoutReference" character varying(128),
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_withdrawal_requests" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_withdrawal_requests_gross_positive" CHECK ("grossAmount" > 0),
        CONSTRAINT "CHK_withdrawal_requests_amounts_balance" CHECK ("grossAmount" = "serviceFee" + "netAmount"),
        CONSTRAINT "FK_withdrawal_requests_campaignId" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_withdrawal_requests_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_withdrawal_requests_campaignId" ON "withdrawal_requests" ("campaignId")`);
    await queryRunner.query(`CREATE INDEX "IDX_withdrawal_requests_userId" ON "withdrawal_requests" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_withdrawal_requests_status" ON "withdrawal_requests" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "withdrawal_requests"`);
    await queryRunner.query(`DROP TABLE "kyc_profiles"`);
    await queryRunner.query(`DROP TYPE "withdrawal_status"`);
    await queryRunner.query(`DROP TYPE "kyc_status"`);
  }
}
