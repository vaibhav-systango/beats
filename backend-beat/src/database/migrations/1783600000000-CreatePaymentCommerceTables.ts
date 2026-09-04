import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentCommerceTables1783600000000 implements MigrationInterface {
  name = 'CreatePaymentCommerceTables1783600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payments" ADD "expires_at" bigint`);
    await queryRunner.query(
      `UPDATE "payments" SET "expires_at" = "created_at" WHERE "expires_at" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "expires_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "inventory_released_at" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "referrer_user_id" character(26)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "promoter_user_id" character(26)`,
    );
    await queryRunner.query(`ALTER TABLE "payments" ADD "fulfilled_at" bigint`);
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "provider_refund_id" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "provider" TYPE character varying(64) USING "provider"::text`,
    );
    await queryRunner.query(`DROP TYPE "public"."payments_provider_enum"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_status_expires" ON "payments" ("status", "expires_at")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."issued_tickets_status_enum" AS ENUM('VALID', 'VOID')`,
    );
    await queryRunner.query(
      `CREATE TABLE "issued_tickets" ("id" character(26) NOT NULL, "payment_id" character(26) NOT NULL, "ticket_type_id" character(26) NOT NULL, "session_id" character(26) NOT NULL, "status" "public"."issued_tickets_status_enum" NOT NULL DEFAULT 'VALID', "created_at" bigint NOT NULL, CONSTRAINT "PK_issued_tickets_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_issued_tickets_payment_id" ON "issued_tickets" ("payment_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "issued_tickets" ADD CONSTRAINT "FK_issued_tickets_payment_id" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "issued_tickets" ADD CONSTRAINT "FK_issued_tickets_ticket_type_id" FOREIGN KEY ("ticket_type_id") REFERENCES "session_ticket_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "issued_tickets" ADD CONSTRAINT "FK_issued_tickets_session_id" FOREIGN KEY ("session_id") REFERENCES "event_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."wallets_owner_type_enum" AS ENUM('PLATFORM', 'USER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "wallets" ("id" character(26) NOT NULL, "owner_type" "public"."wallets_owner_type_enum" NOT NULL, "owner_user_id" character(26), "balance_paise" bigint NOT NULL DEFAULT 0, "created_at" bigint NOT NULL, "updated_at" bigint NOT NULL, CONSTRAINT "PK_wallets_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_wallets_owner" ON "wallets" ("owner_type", "owner_user_id") NULLS NOT DISTINCT`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_wallets_owner_user_id" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."payment_splits_recipient_type_enum" AS ENUM('PLATFORM', 'ORGANIZER', 'PROMOTER', 'REFERRAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_splits_payout_status_enum" AS ENUM('SCHEDULED', 'PAID', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_splits" ("id" character(26) NOT NULL, "payment_id" character(26) NOT NULL, "recipient_type" "public"."payment_splits_recipient_type_enum" NOT NULL, "owner_user_id" character(26), "wallet_id" character(26) NOT NULL, "amount_paise" integer NOT NULL, "payout_status" "public"."payment_splits_payout_status_enum" NOT NULL DEFAULT 'SCHEDULED', "settlement_batch_id" character(26), "settled_at" bigint, "created_at" bigint NOT NULL, CONSTRAINT "PK_payment_splits_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_splits_payment_id" ON "payment_splits" ("payment_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_payment_splits_payment_wallet" ON "payment_splits" ("payment_id", "wallet_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_splits_payout_status" ON "payment_splits" ("payout_status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" ADD CONSTRAINT "FK_payment_splits_payment_id" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" ADD CONSTRAINT "FK_payment_splits_owner_user_id" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" ADD CONSTRAINT "FK_payment_splits_wallet_id" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."wallet_ledger_entries_direction_enum" AS ENUM('CREDIT', 'DEBIT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wallet_ledger_entries_reason_enum" AS ENUM('PAYMENT_SPLIT', 'REFUND_CLAWBACK', 'PAYOUT_SETTLEMENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "wallet_ledger_entries" ("id" character(26) NOT NULL, "wallet_id" character(26) NOT NULL, "amount_paise" integer NOT NULL, "direction" "public"."wallet_ledger_entries_direction_enum" NOT NULL, "reason" "public"."wallet_ledger_entries_reason_enum" NOT NULL, "payment_id" character(26), "split_id" character(26), "reverses_entry_id" character(26), "created_at" bigint NOT NULL, CONSTRAINT "PK_wallet_ledger_entries_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallet_ledger_wallet_id" ON "wallet_ledger_entries" ("wallet_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_wallet_ledger_payment_id" ON "wallet_ledger_entries" ("payment_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_wallet_ledger_idempotent" ON "wallet_ledger_entries" ("wallet_id", "payment_id", "reason", "direction", "split_id") NULLS NOT DISTINCT`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "FK_wallet_ledger_wallet_id" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "FK_wallet_ledger_payment_id" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "payment_webhook_events" ("id" character(26) NOT NULL, "provider" character varying(64) NOT NULL, "provider_event_id" character varying(255) NOT NULL, "payment_id" character(26), "event_type" character varying(64) NOT NULL, "created_at" bigint NOT NULL, CONSTRAINT "PK_payment_webhook_events_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_payment_webhook_events_provider_event" ON "payment_webhook_events" ("provider", "provider_event_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "payment_webhook_events"`);

    await queryRunner.query(
      `ALTER TABLE "wallet_ledger_entries" DROP CONSTRAINT "FK_wallet_ledger_payment_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_ledger_entries" DROP CONSTRAINT "FK_wallet_ledger_wallet_id"`,
    );
    await queryRunner.query(`DROP TABLE "wallet_ledger_entries"`);
    await queryRunner.query(
      `DROP TYPE "public"."wallet_ledger_entries_reason_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wallet_ledger_entries_direction_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "payment_splits" DROP CONSTRAINT "FK_payment_splits_wallet_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" DROP CONSTRAINT "FK_payment_splits_owner_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_splits" DROP CONSTRAINT "FK_payment_splits_payment_id"`,
    );
    await queryRunner.query(`DROP TABLE "payment_splits"`);
    await queryRunner.query(
      `DROP TYPE "public"."payment_splits_payout_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."payment_splits_recipient_type_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_wallets_owner_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(`DROP TYPE "public"."wallets_owner_type_enum"`);

    await queryRunner.query(
      `ALTER TABLE "issued_tickets" DROP CONSTRAINT "FK_issued_tickets_session_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "issued_tickets" DROP CONSTRAINT "FK_issued_tickets_ticket_type_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "issued_tickets" DROP CONSTRAINT "FK_issued_tickets_payment_id"`,
    );
    await queryRunner.query(`DROP TABLE "issued_tickets"`);
    await queryRunner.query(`DROP TYPE "public"."issued_tickets_status_enum"`);

    await queryRunner.query(
      `DROP INDEX "public"."IDX_payments_status_expires"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_provider_enum" AS ENUM('STRIPE', 'RAZORPAY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "provider" TYPE "public"."payments_provider_enum" USING "provider"::"public"."payments_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "provider_refund_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "fulfilled_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "promoter_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "referrer_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "inventory_released_at"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "expires_at"`);
  }
}
