import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOtpTable1782133223715 implements MigrationInterface {
  name = 'UpdateOtpTable1782133223715';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "otps" DROP COLUMN "otpCode"`);
    await queryRunner.query(
      `ALTER TABLE "otps" ADD "otpCode" character varying(6) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" ALTER COLUMN "otpLimit" SET DEFAULT '3'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "otps" ALTER COLUMN "otpLimit" SET DEFAULT '2'`,
    );
    await queryRunner.query(`ALTER TABLE "otps" DROP COLUMN "otpCode"`);
    await queryRunner.query(
      `ALTER TABLE "otps" ADD "otpCode" character varying(4) NOT NULL`,
    );
  }
}
