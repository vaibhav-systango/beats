import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventSessionsTable1782733704764 implements MigrationInterface {
    name = 'CreateEventSessionsTable1782733704764'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."event_sessions_age_restriction_enum" AS ENUM('ALL', '13_PLUS', '16_PLUS', '18_PLUS', '21_PLUS')`);
        await queryRunner.query(`CREATE TYPE "public"."event_sessions_mode_enum" AS ENUM('OFFLINE', 'ONLINE', 'HYBRID')`);
        await queryRunner.query(`CREATE TYPE "public"."event_sessions_status_enum" AS ENUM('ACTIVE', 'CANCELLED', 'COMPLETED')`);
        await queryRunner.query(`CREATE TABLE "event_sessions" ("id" character(26) NOT NULL, "event_id" character(26) NOT NULL, "title" character varying(255), "start_at" bigint NOT NULL, "end_at" bigint NOT NULL, "location" geography(Point,4326) NOT NULL, "event_address" jsonb NOT NULL, "capacity" integer NOT NULL, "age_restriction" "public"."event_sessions_age_restriction_enum" NOT NULL DEFAULT 'ALL', "languages" text array, "event_session_medias" jsonb DEFAULT '{}', "mode" "public"."event_sessions_mode_enum" NOT NULL DEFAULT 'OFFLINE', "ticket_sale_start_at" bigint NOT NULL, "ticket_sale_end_at" bigint NOT NULL, "allow_referral" boolean NOT NULL DEFAULT false, "referral_reward_per_ticket" numeric(10,2), "allow_promoters" boolean NOT NULL DEFAULT false, "promoter_commission_percentage" numeric(5,2), "status" "public"."event_sessions_status_enum" NOT NULL DEFAULT 'ACTIVE', "created_at" bigint NOT NULL, "updated_at" bigint NOT NULL, "deleted_at" bigint, "priority_weight" integer, "priority_expires_at" bigint, "artist_metadata" jsonb, CONSTRAINT "PK_dbe18de390df26f2dffc4ef3356" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6b73f3cc8787c447c534377b3a" ON "event_sessions"  ("start_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_4b33ee3ff662c49f987b9efc80" ON "event_sessions" USING gist ("location") `);
        await queryRunner.query(`CREATE INDEX "IDX_e5d1960b211afb1cf527be19c0" ON "event_sessions"  ("status") `);
        await queryRunner.query(`ALTER TABLE "event_sessions" ADD CONSTRAINT "FK_58ce48ffbbdb12454db743d6cb0" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_sessions" DROP CONSTRAINT "FK_58ce48ffbbdb12454db743d6cb0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e5d1960b211afb1cf527be19c0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4b33ee3ff662c49f987b9efc80"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6b73f3cc8787c447c534377b3a"`);
        await queryRunner.query(`DROP TABLE "event_sessions"`);
        await queryRunner.query(`DROP TYPE "public"."event_sessions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."event_sessions_mode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."event_sessions_age_restriction_enum"`);
    }

}
