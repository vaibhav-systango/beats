import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationTicketingAndReferralFieldsToEvents1782296124395 implements MigrationInterface {
    name = 'AddLocationTicketingAndReferralFieldsToEvents1782296124395'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otps" DROP COLUMN "failedAttempts"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "cover_image_url"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "address" jsonb`);
        await queryRunner.query(`ALTER TABLE "events" ADD "location" geography(Point,4326) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ADD "ticket_sale_start_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "events" ADD "ticket_sale_end_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "events" ADD "total_tickets" integer`);
        await queryRunner.query(`ALTER TABLE "events" ADD "allow_referrals" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "events" ADD "referral_reward_per_ticket" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "events" ADD "allow_promoters" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "events" ADD "promoter_commission_percentage" numeric(5,2)`);
        await queryRunner.query(`ALTER TYPE "public"."events_status_enum" ADD VALUE 'draft'`);
        await queryRunner.query(`ALTER TYPE "public"."events_status_enum" ADD VALUE 'completed'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."events_status_enum_old" AS ENUM('pending_approval', 'approved', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" TYPE "public"."events_status_enum_old" USING "status"::"text"::"public"."events_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."events_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."events_status_enum_old" RENAME TO "events_status_enum"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "promoter_commission_percentage"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "allow_promoters"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "referral_reward_per_ticket"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "allow_referrals"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "total_tickets"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "ticket_sale_end_at"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "ticket_sale_start_at"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "cover_image_url" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "otps" ADD "failedAttempts" integer NOT NULL DEFAULT '0'`);
    }

}
