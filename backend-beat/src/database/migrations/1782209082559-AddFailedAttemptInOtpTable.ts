import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFailedAttemptInOtpTable1782209082559 implements MigrationInterface {
  name = 'AddFailedAttemptInOtpTable1782209082559';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "otps" ADD "failedAttempts" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "otps" DROP COLUMN "failedAttempts"`);
  }
}
