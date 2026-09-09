import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOwnerUserIdToIssuedTickets1783800000000
  implements MigrationInterface
{
  name = 'AddOwnerUserIdToIssuedTickets1783800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "issued_tickets" ADD "owner_user_id" character(26)`,
    );
    await queryRunner.query(`
      UPDATE "issued_tickets" AS ticket
      SET "owner_user_id" = payment."user_id"
      FROM "payments" AS payment
      WHERE payment."id" = ticket."payment_id"
        AND payment."user_id" IS NOT NULL
    `);
    await queryRunner.query(`
      DELETE FROM "issued_tickets"
      WHERE "owner_user_id" IS NULL
    `);
    await queryRunner.query(
      `ALTER TABLE "issued_tickets" ALTER COLUMN "owner_user_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_issued_tickets_owner_user_id" ON "issued_tickets" ("owner_user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "issued_tickets" ADD CONSTRAINT "FK_issued_tickets_owner_user_id" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "issued_tickets" DROP CONSTRAINT "FK_issued_tickets_owner_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_issued_tickets_owner_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "issued_tickets" DROP COLUMN "owner_user_id"`,
    );
  }
}
