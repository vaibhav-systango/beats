import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoutePermission1782715299922 implements MigrationInterface {
  name = 'AddRoutePermission1782715299922';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "route_permissions" ("id" character(26) NOT NULL, "route" character varying NOT NULL, "method" character varying NOT NULL, "permissionIds" character varying array NOT NULL, CONSTRAINT "PK_f4ebaa8b53a13bdf4da12a1b742" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_UNIQUE_ROUTE_METHOD" ON "route_permissions"  ("route", "method") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_UNIQUE_ROUTE_METHOD"`);
    await queryRunner.query(`DROP TABLE "route_permissions"`);
  }
}
