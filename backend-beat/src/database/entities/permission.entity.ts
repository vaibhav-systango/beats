import {
  Entity,
  PrimaryColumn,
  Column,
  Unique,
  ManyToMany,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';
import { Role } from './role.entity';

@Entity({ name: 'permissions' })
@Unique(['name'])
export class Permission {
  @PrimaryColumn('char', { length: 26 })
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = ulid();
    }
  }

  @Column()
  name: string;

  @Column()
  description: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
