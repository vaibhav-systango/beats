import { Entity, PrimaryColumn, Column, Index, BeforeInsert } from 'typeorm';
import { ulid } from 'ulid';

@Index('IDX_UNIQUE_ROUTE_METHOD', ['route', 'method'], { unique: true })
@Entity({ name: 'route_permissions' })
export class RoutePermission {
  @PrimaryColumn('char', { length: 26 })
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = ulid();
    }
  }

  @Column()
  route: string;

  @Column()
  method: string;

  @Column({
    type: 'varchar',
    array: true,
    nullable: false,
  })
  permissionIds: string[];
}
