import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefreshTokens1730000001000 implements MigrationInterface {
  name = 'RefreshTokens1730000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "tokenHash" character varying(64) NOT NULL,
        "expiresAt" timestamp with time zone NOT NULL,
        "revokedAt" timestamp with time zone,
        "replacedBy" uuid,
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_tokens_tokenHash" UNIQUE ("tokenHash")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("userId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
        ADD CONSTRAINT "FK_refresh_tokens_userId_users"
        FOREIGN KEY ("userId")
        REFERENCES "users"("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens"
        DROP CONSTRAINT "FK_refresh_tokens_userId_users"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_refresh_tokens_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
