import { MigrationInterface, QueryRunner } from 'typeorm';
import { ulid } from 'ulid';

export class CreateRoleEntries1782124404795 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO roles (id, name, description)
      VALUES
      ('${ulid()}', 'ADMIN', 'Admin Role'),
      ('${ulid()}', 'USER', 'User Role'),
      ('${ulid()}', 'ORGANIZER', 'Organizer Role')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM roles
      WHERE name IN ('ADMIN', 'USER', 'ORGANIZER')
    `);
  }
}
