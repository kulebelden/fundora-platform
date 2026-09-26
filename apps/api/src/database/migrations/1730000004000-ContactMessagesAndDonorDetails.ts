import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - `contact_messages`: submissions from the public contact form, read by staff.
 * - Donor details on `payment_intents`: what the donor typed in the donation form
 *   (name, email, phone, message). Card data is never collected by HopeNest; the
 *   payment processor handles it on its own page.
 */
export class ContactMessagesAndDonorDetails1730000004000 implements MigrationInterface {
  name = 'ContactMessagesAndDonorDetails1730000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contact_messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(120) NOT NULL,
        "email" character varying(255) NOT NULL,
        "phone" character varying(32),
        "topic" character varying(40) NOT NULL,
        "subject" character varying(200) NOT NULL,
        "message" text NOT NULL,
        "campaignLink" character varying(2048),
        "userId" uuid,
        "isRead" boolean NOT NULL DEFAULT false,
        "readAt" timestamp with time zone,
        "readBy" uuid,
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contact_messages_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_contact_messages_userId_users" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_contact_messages_unread" ON "contact_messages" ("isRead", "createdAt")`,
    );

    await queryRunner.query(`
      ALTER TABLE "payment_intents"
        ADD COLUMN IF NOT EXISTS "donorName" character varying(160),
        ADD COLUMN IF NOT EXISTS "donorEmail" character varying(255),
        ADD COLUMN IF NOT EXISTS "donorPhone" character varying(32),
        ADD COLUMN IF NOT EXISTS "donorMessage" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payment_intents"
        DROP COLUMN IF EXISTS "donorMessage",
        DROP COLUMN IF EXISTS "donorPhone",
        DROP COLUMN IF EXISTS "donorEmail",
        DROP COLUMN IF EXISTS "donorName"
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contact_messages_unread"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_messages"`);
  }
}
