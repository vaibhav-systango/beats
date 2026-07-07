import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedRolePermissionEventCategory1783397493726 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "public"."role_permissions" ("roleId", "permissionId") VALUES
        ('01KVQEBQF3JCC7ZT3WS5PA8JVX', '01J25X4W1X23456789ABCDEFGH')
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "public"."role_permissions"
      WHERE "roleId" = '01KVQEBQF3JCC7ZT3WS5PA8JVX' AND "permissionId" = '01J25X4W1X23456789ABCDEFGH';
    `);
  }
}
