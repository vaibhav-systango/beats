import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ulid } from 'ulid';
import { bigintTransformer } from './event.entity';
import { Payment } from './payment.entity';
import { User } from './user.entity';
import { Wallet } from './wallet.entity';

export enum SplitRecipientType {
  PLATFORM = 'PLATFORM',
  ORGANIZER = 'ORGANIZER',
  PROMOTER = 'PROMOTER',
  REFERRAL = 'REFERRAL',
}

export enum PayoutStatus {
  SCHEDULED = 'SCHEDULED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('payment_splits')
@Index('IDX_payment_splits_payment_id', ['paymentId'])
@Index('UQ_payment_splits_payment_wallet', ['paymentId', 'walletId'], {
  unique: true,
})
@Index('IDX_payment_splits_payout_status', ['payoutStatus'])
export class PaymentSplit {
  @PrimaryColumn({
    type: 'char',
    length: 26,
  })
  id: string;

  @Column({
    name: 'payment_id',
    type: 'char',
    length: 26,
  })
  paymentId: string;

  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({
    name: 'recipient_type',
    type: 'enum',
    enum: SplitRecipientType,
  })
  recipientType: SplitRecipientType;

  @Column({
    name: 'owner_user_id',
    type: 'char',
    length: 26,
    nullable: true,
  })
  ownerUserId?: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_user_id' })
  owner?: User | null;

  @Column({
    name: 'wallet_id',
    type: 'char',
    length: 26,
  })
  walletId: string;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column({
    name: 'amount_paise',
    type: 'integer',
  })
  amountPaise: number;

  @Column({
    name: 'payout_status',
    type: 'enum',
    enum: PayoutStatus,
    default: PayoutStatus.SCHEDULED,
  })
  payoutStatus: PayoutStatus;

  @Column({
    name: 'settlement_batch_id',
    type: 'char',
    length: 26,
    nullable: true,
  })
  settlementBatchId?: string | null;

  @Column({
    name: 'settled_at',
    type: 'bigint',
    nullable: true,
    transformer: bigintTransformer,
  })
  settledAt?: number | null;

  @Column({
    name: 'created_at',
    type: 'bigint',
    transformer: bigintTransformer,
  })
  createdAt: number;

  @BeforeInsert()
  preInsert(): void {
    if (!this.id) {
      this.id = ulid();
    }
    if (!this.createdAt) {
      this.createdAt = Date.now();
    }
  }
}
