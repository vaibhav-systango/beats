import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoleEntries1782124404795 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO roles (id, name, description)
      VALUES
      ('01KVQEBQF3JCC7ZT3WS5PA8JVX', 'ADMIN', 'Admin Role'),
      ('01KVQEBQF33V20EVY50PD9Q78M', 'USER', 'User Role'),
      ('01KVQEBQF313JDXAF9FECBWQ4R', 'ORGANIZER', 'Organizer Role')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM roles
      WHERE name IN ('ADMIN', 'USER', 'ORGANIZER')
    `);
  }
}
