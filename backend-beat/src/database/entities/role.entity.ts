import { UserRole } from '../../common/enums/user.enums';
import {
  Entity,
  PrimaryColumn,
  Column,
  BeforeInsert,
  OneToMany,
} from 'typeorm';
import { ulid } from 'ulid';
import { User } from './user.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryColumn('char', { length: 26 })
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = ulid();
    }
  }

  @Column({
    unique: true,
    type: 'enum',
    enum: UserRole,
  })
  name: UserRole;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  description: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
