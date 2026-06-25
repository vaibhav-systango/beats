import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventTable1782208754438 implements MigrationInterface {
    name = 'CreateEventTable1782208754438'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."events_status_enum" AS ENUM('pending_approval', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TYPE "public"."events_visibility_enum" AS ENUM('public', 'private')`);
        await queryRunner.query(`CREATE TABLE "events" ("id" character(26) NOT NULL, "organizer_id" character(26) NOT NULL, "category_id" character(26) NOT NULL, "title" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "description" text NOT NULL, "start_datetime" TIMESTAMP NOT NULL, "end_datetime" TIMESTAMP NOT NULL, "cover_image_url" character varying(500), "status" "public"."events_status_enum" NOT NULL DEFAULT 'pending_approval', "approved_at" TIMESTAMP, "approved_by" character(26), "rejected_at" TIMESTAMP, "rejected_by" character(26), "rejection_reason" text, "media" jsonb NOT NULL, "visibility" "public"."events_visibility_enum" NOT NULL DEFAULT 'public', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_05bd884c03d3f424e2204bd14cd" UNIQUE ("slug"), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_14c9ce53a2c2a1c781b8390123e" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_643188b30e049632f80367be4e1" FOREIGN KEY ("category_id") REFERENCES "event_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_0074f6038a1aa2687f10bedf7ba" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_fee5193f1e739af35f72c1a33b2" FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_fee5193f1e739af35f72c1a33b2"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_0074f6038a1aa2687f10bedf7ba"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_643188b30e049632f80367be4e1"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_14c9ce53a2c2a1c781b8390123e"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TYPE "public"."events_visibility_enum"`);
        await queryRunner.query(`DROP TYPE "public"."events_status_enum"`);
    }

}
