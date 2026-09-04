import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentsTable1783500000000 implements MigrationInterface {
  name = 'CreatePaymentsTable1783500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."payments_provider_enum" AS ENUM('STRIPE', 'RAZORPAY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" character(26) NOT NULL, "user_id" character(26) NOT NULL, "provider" "public"."payments_provider_enum" NOT NULL, "provider_payment_id" character varying(255), "provider_order_id" character varying(255), "amount" integer NOT NULL, "currency" character(3) NOT NULL DEFAULT 'INR', "status" "public"."payments_status_enum" NOT NULL DEFAULT 'CREATED', "idempotency_key" character varying(64) NOT NULL, "failure_code" character varying(100), "failure_message" text, "refunded_amount" integer NOT NULL DEFAULT '0', "metadata" jsonb NOT NULL DEFAULT '{}', "created_at" bigint NOT NULL, "updated_at" bigint NOT NULL, CONSTRAINT "PK_payments_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_payments_user_idempotency" ON "payments" ("user_id", "idempotency_key") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_payments_provider_order_id" ON "payments" ("provider", "provider_order_id") WHERE "provider_order_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_user_id" ON "payments" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_status" ON "payments" ("status") `,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_user_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_user_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_payments_provider_order_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_payments_user_idempotency"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_provider_enum"`);
  }
}
