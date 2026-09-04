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
import { ulid } from 'ulid';
import { User } from './user.entity';
import { bigintTransformer } from './event.entity';

export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface PaymentLineItem {
  ticketTypeId: string;
  sessionId: string;
  quantity: number;
  unitPricePaise: number;
}

export interface PaymentMetadata {
  items: PaymentLineItem[];
}

@Entity('payments')
@Index('UQ_payments_user_idempotency', ['userId', 'idempotencyKey'], {
  unique: true,
})
@Index('UQ_payments_provider_order_id', ['provider', 'providerOrderId'], {
  unique: true,
  where: '"provider_order_id" IS NOT NULL',
})
@Index('IDX_payments_user_id', ['userId'])
@Index('IDX_payments_status', ['status'])
@Index('IDX_payments_status_expires', ['status', 'expiresAt'])
export class Payment {
  @PrimaryColumn({
    type: 'char',
    length: 26,
  })
  id: string;

  @Column({
    name: 'user_id',
    type: 'char',
    length: 26,
  })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar',
    length: 64,
  })
  provider: string;

  @Column({
    name: 'provider_payment_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerPaymentId?: string | null;

  @Column({
    name: 'provider_order_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerOrderId?: string | null;

  @Column({
    type: 'integer',
  })
  amount: number;

  @Column({
    type: 'char',
    length: 3,
    default: 'INR',
  })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.CREATED,
  })
  status: PaymentStatus;

  @Column({
    name: 'idempotency_key',
    type: 'varchar',
    length: 64,
  })
  idempotencyKey: string;

  @Column({
    name: 'failure_code',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  failureCode?: string | null;

  @Column({
    name: 'failure_message',
    type: 'text',
    nullable: true,
  })
  failureMessage?: string | null;

  @Column({
    name: 'expires_at',
    type: 'bigint',
    transformer: bigintTransformer,
  })
  expiresAt: number;

  @Column({
    name: 'inventory_released_at',
    type: 'bigint',
    nullable: true,
    transformer: bigintTransformer,
  })
  inventoryReleasedAt?: number | null;

  @Column({
    name: 'referrer_user_id',
    type: 'char',
    length: 26,
    nullable: true,
  })
  referrerUserId?: string | null;

  @Column({
    name: 'promoter_user_id',
    type: 'char',
    length: 26,
    nullable: true,
  })
  promoterUserId?: string | null;

  @Column({
    name: 'fulfilled_at',
    type: 'bigint',
    nullable: true,
    transformer: bigintTransformer,
  })
  fulfilledAt?: number | null;

  @Column({
    name: 'provider_refund_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerRefundId?: string | null;

  @Column({
    name: 'refunded_amount',
    type: 'integer',
    default: 0,
  })
  refundedAmount: number;

  @Column({
    type: 'jsonb',
    default: {},
  })
  metadata: PaymentMetadata;

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
