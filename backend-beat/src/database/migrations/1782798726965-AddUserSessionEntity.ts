import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSessionEntity1782798726965 implements MigrationInterface {
  name = 'AddUserSessionEntity1782798726965';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_sessions" ("id" character(26) NOT NULL, "userId" character(26) NOT NULL, "refreshTokenHash" character varying(500) NOT NULL, "deviceMetadata" jsonb NOT NULL DEFAULT '{}', "lastActiveAt" bigint, "isActive" boolean NOT NULL DEFAULT true, "createdAt" bigint NOT NULL, "updatedAt" bigint NOT NULL, CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_844a6b9e7c919908bce255f771" ON "user_sessions"  ("lastActiveAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8da92f9b10e513921836cab2ce" ON "user_sessions"  ("isActive") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_55fa4db8406ed66bc7044328427" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_55fa4db8406ed66bc7044328427"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8da92f9b10e513921836cab2ce"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_844a6b9e7c919908bce255f771"`,
    );
    await queryRunner.query(`DROP TABLE "user_sessions"`);
  }
}
