import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedNameFeildAndAddedIsDeletedInEventCategory1782367620442 implements MigrationInterface {
    name = 'UpdatedNameFeildAndAddedIsDeletedInEventCategory1782367620442'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_categories" ADD "is_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "event_categories" DROP CONSTRAINT "UQ_16952bc5124b9961178b9972902"`);
        await queryRunner.query(`ALTER TABLE "event_categories" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "event_categories" ADD "name" citext NOT NULL`);
        await queryRunner.query(`ALTER TABLE "event_categories" ADD CONSTRAINT "UQ_16952bc5124b9961178b9972902" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "location" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "location" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "event_categories" DROP CONSTRAINT "UQ_16952bc5124b9961178b9972902"`);
        await queryRunner.query(`ALTER TABLE "event_categories" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "event_categories" ADD "name" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "event_categories" ADD CONSTRAINT "UQ_16952bc5124b9961178b9972902" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "event_categories" DROP COLUMN "is_deleted"`);
    }

}
