import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEventsTable1782732981929 implements MigrationInterface {
    name = 'UpdateEventsTable1782732981929'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_643188b30e049632f80367be4e1"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_0074f6038a1aa2687f10bedf7ba"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_fee5193f1e739af35f72c1a33b2"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "category_id"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "start_datetime"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "end_datetime"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "approved_at"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "approved_by"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "rejected_at"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "rejected_by"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "rejection_reason"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "media"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "visibility"`);
        await queryRunner.query(`DROP TYPE "public"."events_visibility_enum"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "ticket_sale_start_at"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "ticket_sale_end_at"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "total_tickets"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "allow_referrals"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "referral_reward_per_ticket"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "allow_promoters"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "promoter_commission_percentage"`);
        await queryRunner.query(`ALTER TABLE "otps" ADD "failedAttempts" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "events" ADD "status_log" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TYPE "public"."events_status_enum" RENAME TO "events_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."events_status_enum" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PUBLISHED', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" TYPE "public"."events_status_enum" USING "status"::"text"::"public"."events_status_enum"`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`);
        await queryRunner.query(`DROP TYPE "public"."events_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "created_at" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "updated_at" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "deleted_at" bigint`);
        await queryRunner.query(`CREATE INDEX "IDX_bab6cf3a1e33e6790e9b9bd7d1" ON "events"  ("title") `);
        await queryRunner.query(`CREATE INDEX "IDX_03dcebc1ab44daa177ae9479c4" ON "events"  ("status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_03dcebc1ab44daa177ae9479c4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bab6cf3a1e33e6790e9b9bd7d1"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE TYPE "public"."events_status_enum_old" AS ENUM('pending_approval', 'approved', 'rejected', 'draft', 'completed')`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" TYPE "public"."events_status_enum_old" USING "status"::"text"::"public"."events_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'pending_approval'`);
        await queryRunner.query(`DROP TYPE "public"."events_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."events_status_enum_old" RENAME TO "events_status_enum"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "status_log"`);
        await queryRunner.query(`ALTER TABLE "otps" DROP COLUMN "failedAttempts"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "promoter_commission_percentage" numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "events" ADD "allow_promoters" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "events" ADD "referral_reward_per_ticket" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "events" ADD "allow_referrals" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "events" ADD "total_tickets" integer`);
        await queryRunner.query(`ALTER TABLE "events" ADD "ticket_sale_end_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "events" ADD "ticket_sale_start_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "events" ADD "location" geography(Point,4326)`);
        await queryRunner.query(`ALTER TABLE "events" ADD "address" jsonb`);
        await queryRunner.query(`CREATE TYPE "public"."events_visibility_enum" AS ENUM('public', 'private')`);
        await queryRunner.query(`ALTER TABLE "events" ADD "visibility" "public"."events_visibility_enum" NOT NULL DEFAULT 'public'`);
        await queryRunner.query(`ALTER TABLE "events" ADD "media" jsonb NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ADD "rejection_reason" text`);
        await queryRunner.query(`ALTER TABLE "events" ADD "rejected_by" character(26)`);
        await queryRunner.query(`ALTER TABLE "events" ADD "rejected_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "events" ADD "approved_by" character(26)`);
        await queryRunner.query(`ALTER TABLE "events" ADD "approved_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "events" ADD "end_datetime" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ADD "start_datetime" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ADD "category_id" character(26) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_fee5193f1e739af35f72c1a33b2" FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_0074f6038a1aa2687f10bedf7ba" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_643188b30e049632f80367be4e1" FOREIGN KEY ("category_id") REFERENCES "event_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
