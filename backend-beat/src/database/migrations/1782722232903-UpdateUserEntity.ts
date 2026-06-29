import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserEntity1782722232903 implements MigrationInterface {
    name = 'UpdateUserEntity1782722232903'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_categories" ("userId" character(26) NOT NULL, "categoryId" character(26) NOT NULL, CONSTRAINT "PK_5276dfeb5f8a30b06db59f7459f" PRIMARY KEY ("userId", "categoryId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bf0025b51dced9b204795ae530" ON "user_categories"  ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_32453eeb41418302e5e2a5cbc2" ON "user_categories"  ("categoryId") `);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_61dc14c8c49c187f5d08047c985"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mobileNumber"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "fullName" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isEmailVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "countryCode" character varying(5) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phoneNumber" character varying(15) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_1e3d0240b49c40521aaeb953293" UNIQUE ("phoneNumber")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "profileImage" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "location" geography(Point,4326)`);
        await queryRunner.query(`CREATE TYPE "public"."users_onboardingstatus_enum" AS ENUM('PROFILE_PENDING', 'COMPLETED')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "onboardingStatus" "public"."users_onboardingstatus_enum" NOT NULL DEFAULT 'PROFILE_PENDING'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" bigint`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "createdAt" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updatedAt" bigint NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_15b3fe608b52f34df363512e39" ON "users" USING gist ("location") `);
        await queryRunner.query(`CREATE INDEX "IDX_2b19eeaa14bbf204cce8e01e57" ON "users"  ("onboardingStatus") `);
        await queryRunner.query(`CREATE INDEX "IDX_409a0298fdd86a6495e23c25c6" ON "users"  ("isActive") `);
        await queryRunner.query(`ALTER TABLE "user_categories" ADD CONSTRAINT "FK_bf0025b51dced9b204795ae5308" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_categories" ADD CONSTRAINT "FK_32453eeb41418302e5e2a5cbc2d" FOREIGN KEY ("categoryId") REFERENCES "event_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_categories" DROP CONSTRAINT "FK_32453eeb41418302e5e2a5cbc2d"`);
        await queryRunner.query(`ALTER TABLE "user_categories" DROP CONSTRAINT "FK_bf0025b51dced9b204795ae5308"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_409a0298fdd86a6495e23c25c6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2b19eeaa14bbf204cce8e01e57"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_15b3fe608b52f34df363512e39"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "onboardingStatus"`);
        await queryRunner.query(`DROP TYPE "public"."users_onboardingstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profileImage"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_1e3d0240b49c40521aaeb953293"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phoneNumber"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "countryCode"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isEmailVerified"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fullName"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "mobileNumber" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_61dc14c8c49c187f5d08047c985" UNIQUE ("mobileNumber")`);
        await queryRunner.query(`DROP INDEX "public"."IDX_32453eeb41418302e5e2a5cbc2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bf0025b51dced9b204795ae530"`);
        await queryRunner.query(`DROP TABLE "user_categories"`);
    }

}
