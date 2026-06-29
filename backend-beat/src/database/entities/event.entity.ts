import {
  Entity,
  Column,
  BeforeInsert,
  PrimaryColumn,
  Index,
  ManyToOne,
  JoinColumn,
  BeforeUpdate,
} from 'typeorm';
import { ulid } from 'ulid';
import { User } from './user.entity';

export enum EventStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface StatusLogEntry {
  action: string;
  adminId: string;
  timestamp: number;
  reason?: string;
}

export const bigintTransformer = {
  to: (value: number | null | undefined): string | null | undefined => {
    return value !== undefined && value !== null ? value.toString() : value;
  },
  from: (value: string | null | undefined): number | null | undefined => {
    return value !== undefined && value !== null ? Number(value) : value;
  },
};

@Entity('events')
export class Event {
  @PrimaryColumn({
    type: 'char',
    length: 26,
  })
  id: string;

  @Column({
    name: 'organizer_id',
    type: 'char',
    length: 26,
  })
  organizerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'organizer_id' })
  organizer!: User;

  @Column({
    type: 'varchar',
    length: 255,
  })
  @Index()
  title: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  slug: string;

  @Column({
    type: 'text',
  })
  description: string;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  @Index()
  status: EventStatus;

  @Column({
    name: 'status_log',
    type: 'jsonb',
    default: [],
  })
  statusLog: StatusLogEntry[];

  @Column({
    name: 'created_at',
    type: 'bigint',
    transformer: bigintTransformer,
  })
  createdAt: number;

  @Column({
    name: 'updated_at',
    type: 'bigint',
    transformer: bigintTransformer,
  })
  updatedAt: number;

  @Column({
    name: 'deleted_at',
    type: 'bigint',
    nullable: true,
    transformer: bigintTransformer,
  })
  deletedAt?: number;

  @BeforeInsert()
  preInsert(): void {
    if (!this.id) {
      this.id = ulid();
    }
    const now = Date.now();
    if (!this.createdAt) {
      this.createdAt = now;
    }
    if (!this.updatedAt) {
      this.updatedAt = now;
    }
  }

  @BeforeUpdate()
  updateTimestamp(): void {
    this.updatedAt = Date.now();
  }
}
