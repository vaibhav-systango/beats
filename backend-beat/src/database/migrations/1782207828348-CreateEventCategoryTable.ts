import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventCategoryTable1782207828348 implements MigrationInterface {
    name = 'CreateEventCategoryTable1782207828348'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "event_categories" ("id" character(26) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_16952bc5124b9961178b9972902" UNIQUE ("name"), CONSTRAINT "PK_a6368447a61afbf9def09fd81af" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "event_categories"`);
    }

}
