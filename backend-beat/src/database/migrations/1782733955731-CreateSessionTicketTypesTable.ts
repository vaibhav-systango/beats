import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSessionTicketTypesTable1782733955731 implements MigrationInterface {
    name = 'CreateSessionTicketTypesTable1782733955731'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."session_ticket_types_status_enum" AS ENUM('ACTIVE', 'SOLD_OUT', 'INACTIVE')`);
        await queryRunner.query(`CREATE TABLE "session_ticket_types" ("id" character(26) NOT NULL, "session_id" character(26) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "price" numeric(10,2) NOT NULL DEFAULT '0', "quantity" integer NOT NULL DEFAULT '0', "max_purchase_limit" integer NOT NULL DEFAULT '10', "sale_start_at" bigint NOT NULL, "sale_end_at" bigint NOT NULL, "status" "public"."session_ticket_types_status_enum" NOT NULL DEFAULT 'ACTIVE', "created_at" bigint NOT NULL, "updated_at" bigint NOT NULL, CONSTRAINT "PK_0418890adc548cbdc2a079af241" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2d4b1a2075b82a73d8c89426c8" ON "session_ticket_types"  ("status") `);
        await queryRunner.query(`ALTER TABLE "session_ticket_types" ADD CONSTRAINT "FK_cad9d3c7839ed29d1ba5dec44e9" FOREIGN KEY ("session_id") REFERENCES "event_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_ticket_types" DROP CONSTRAINT "FK_cad9d3c7839ed29d1ba5dec44e9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2d4b1a2075b82a73d8c89426c8"`);
        await queryRunner.query(`DROP TABLE "session_ticket_types"`);
        await queryRunner.query(`DROP TYPE "public"."session_ticket_types_status_enum"`);
    }

}
