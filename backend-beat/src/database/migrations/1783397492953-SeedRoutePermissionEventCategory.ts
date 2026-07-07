import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedRoutePermissionEventCategory1783397492953 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "public"."route_permissions" ("id", "route", "method", "permissionIds") VALUES
        ('01J25X4W1X23456789ABCDEFGI', '/api/v1/event-categories', 'POST', '{"01J25X4W1X23456789ABCDEFGH"}')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "public"."route_permissions" WHERE "id" IN ('01J25X4W1X23456789ABCDEFGI');
    `);
  }
}
