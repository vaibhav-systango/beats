import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOtpsTable1782121994237 implements MigrationInterface {
    name = 'CreateOtpsTable1782121994237'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."otps_accounttype_enum" AS ENUM('USER', 'ORGANIZER', 'PROMOTER', 'ADMIN')`);
        await queryRunner.query(`CREATE TYPE "public"."otps_purpose_enum" AS ENUM('LOGIN', 'SIGNUP')`);
        await queryRunner.query(`CREATE TABLE "otps" ("id" character(26) NOT NULL, "countryCode" character varying(5) NOT NULL, "phoneNumber" character varying(15) NOT NULL, "accountType" "public"."otps_accounttype_enum" NOT NULL, "purpose" "public"."otps_purpose_enum" NOT NULL, "otpCode" character varying(4) NOT NULL, "otpLimit" integer NOT NULL DEFAULT '2', "createdAt" bigint NOT NULL, "updatedAt" bigint NOT NULL, CONSTRAINT "PK_91fef5ed60605b854a2115d2410" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_098a3c1a58f6554e521181ef9a" ON "otps"  ("countryCode", "phoneNumber", "accountType", "purpose") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_098a3c1a58f6554e521181ef9a"`);
        await queryRunner.query(`DROP TABLE "otps"`);
        await queryRunner.query(`DROP TYPE "public"."otps_purpose_enum"`);
        await queryRunner.query(`DROP TYPE "public"."otps_accounttype_enum"`);
    }

}
