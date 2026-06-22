import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRolesTable1782120236668 implements MigrationInterface {
    name = 'CreateRolesTable1782120236668'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."roles_name_enum" AS ENUM('USER', 'ORGANIZER', 'PROMOTER', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" character(26) NOT NULL, "name" "public"."roles_name_enum" NOT NULL, "description" character varying(255) NOT NULL, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "roleId" character(26) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_368e146b785b574f42ae9e53d5e" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_368e146b785b574f42ae9e53d5e"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "roleId"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TYPE "public"."roles_name_enum"`);
    }

}
