import { MigrationInterface, QueryRunner } from 'typeorm';

/** Links users to the Google and Apple accounts they sign in with. */
export class OAuthIdentities1730000006000 implements MigrationInterface {
  name = 'OAuthIdentities1730000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_identities" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "provider" character varying(16) NOT NULL,
        "subject" character varying(255) NOT NULL,
        "email" character varying(255),
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_identities" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_user_identities_provider" CHECK ("provider" IN ('google', 'apple'))
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_identities_provider_subject" ON "user_identities" ("provider", "subject")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_identities_user_id" ON "user_identities" ("userId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "user_identities"
        ADD CONSTRAINT "FK_user_identities_userId_users"
        FOREIGN KEY ("userId")
        REFERENCES "users"("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_identities" DROP CONSTRAINT "FK_user_identities_userId_users"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_user_identities_user_id"`);
    await queryRunner.query(`DROP INDEX "UQ_user_identities_provider_subject"`);
    await queryRunner.query(`DROP TABLE "user_identities"`);
  }
}
