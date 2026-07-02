import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSessionCategoriesTable1782733877171 implements MigrationInterface {
    name = 'CreateSessionCategoriesTable1782733877171'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "session_categories" ("session_id" character(26) NOT NULL, "category_id" character(26) NOT NULL, "created_at" bigint NOT NULL, CONSTRAINT "PK_b51d99985910fd80b3238507b54" PRIMARY KEY ("session_id", "category_id"))`);
        await queryRunner.query(`ALTER TABLE "session_categories" ADD CONSTRAINT "FK_9e00dc51091cd96e9e78595ea06" FOREIGN KEY ("session_id") REFERENCES "event_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "session_categories" ADD CONSTRAINT "FK_272c028b6263e9d742eee8a3da6" FOREIGN KEY ("category_id") REFERENCES "event_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_categories" DROP CONSTRAINT "FK_272c028b6263e9d742eee8a3da6"`);
        await queryRunner.query(`ALTER TABLE "session_categories" DROP CONSTRAINT "FK_9e00dc51091cd96e9e78595ea06"`);
        await queryRunner.query(`DROP TABLE "session_categories"`);
    }

}
