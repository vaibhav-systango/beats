import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuestFieldsToSessionsAndIssuedTickets1783700000000
  implements MigrationInterface
{
  name = 'AddGuestFieldsToSessionsAndIssuedTickets1783700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event_sessions" ADD "require_guest_name" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_sessions" ADD "require_guest_age" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "issued_tickets" ADD "guest_name" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "issued_tickets" ADD "guest_age" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "issued_tickets" DROP COLUMN "guest_age"`,
    );
    await queryRunner.query(
      `ALTER TABLE "issued_tickets" DROP COLUMN "guest_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_sessions" DROP COLUMN "require_guest_age"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_sessions" DROP COLUMN "require_guest_name"`,
    );
  }
}
