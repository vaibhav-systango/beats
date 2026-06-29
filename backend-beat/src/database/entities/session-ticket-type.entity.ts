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
import { EventSession } from './event-session.entity';
import { bigintTransformer } from './event.entity';

export enum TicketTypeStatus {
  ACTIVE = 'ACTIVE',
  SOLD_OUT = 'SOLD_OUT',
  INACTIVE = 'INACTIVE',
}

@Entity('session_ticket_types')
export class SessionTicketType {
  @PrimaryColumn({
    type: 'char',
    length: 26,
  })
  id: string;

  @Column({
    name: 'session_id',
    type: 'char',
    length: 26,
  })
  sessionId: string;

  @ManyToOne(() => EventSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: EventSession;

  @Column({
    type: 'varchar',
    length: 100,
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  price: number;

  @Column({
    type: 'integer',
    default: 0,
  })
  quantity: number;

  @Column({
    name: 'max_purchase_limit',
    type: 'integer',
    default: 10,
  })
  maxPurchaseLimit: number;

  @Column({
    name: 'sale_start_at',
    type: 'bigint',
    transformer: bigintTransformer,
  })
  saleStartAt: number;

  @Column({
    name: 'sale_end_at',
    type: 'bigint',
    transformer: bigintTransformer,
  })
  saleEndAt: number;

  @Column({
    type: 'enum',
    enum: TicketTypeStatus,
    default: TicketTypeStatus.ACTIVE,
  })
  @Index()
  status: TicketTypeStatus;

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
