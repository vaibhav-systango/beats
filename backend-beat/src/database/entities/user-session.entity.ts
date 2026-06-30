import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { ulid } from 'ulid';

@Entity('user_sessions')
export class UserSession {
  @PrimaryColumn('char', { length: 26 })
  id: string;

  @BeforeInsert()
  beforeInsert() {
    if (!this.id) {
      this.id = ulid();
    }
    const now = Date.now();
    this.createdAt = now;
    this.updatedAt = now;
  }

  @BeforeUpdate()
  beforeUpdate() {
    this.updatedAt = Date.now();
  }

  @Column('char', { length: 26 })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 500 })
  refreshTokenHash: string;

  @Column({ type: 'jsonb', default: {} })
  deviceMetadata: Record<string, any>;

  @Index()
  @Column({ type: 'bigint', nullable: true })
  lastActiveAt: number;

  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'bigint' })
  createdAt: number;

  @Column({ type: 'bigint' })
  updatedAt: number;
}
