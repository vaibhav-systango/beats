import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPermissionEventCategory1783397492070 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "public"."permissions" ("id", "name", "description") VALUES
        ('01J25X4W1X23456789ABCDEFGH', 'create:event-category', 'User can create event categories')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "public"."permissions" WHERE "id" IN ('01J25X4W1X23456789ABCDEFGH');
    `);
  }
}
