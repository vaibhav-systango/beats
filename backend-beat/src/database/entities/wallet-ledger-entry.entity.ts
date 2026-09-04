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
import { Wallet } from './wallet.entity';
import { Payment } from './payment.entity';

export enum LedgerDirection {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum LedgerReason {
  PAYMENT_SPLIT = 'PAYMENT_SPLIT',
  REFUND_CLAWBACK = 'REFUND_CLAWBACK',
  PAYOUT_SETTLEMENT = 'PAYOUT_SETTLEMENT',
}

@Entity('wallet_ledger_entries')
@Index('IDX_wallet_ledger_wallet_id', ['walletId'])
@Index('IDX_wallet_ledger_payment_id', ['paymentId'])
@Index(
  'UQ_wallet_ledger_idempotent',
  ['walletId', 'paymentId', 'reason', 'direction'],
  {
    unique: true,
  },
)
export class WalletLedgerEntry {
  @PrimaryColumn({
    type: 'char',
    length: 26,
  })
  id: string;

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
    type: 'enum',
    enum: LedgerDirection,
  })
  direction: LedgerDirection;

  @Column({
    type: 'enum',
    enum: LedgerReason,
  })
  reason: LedgerReason;

  @Column({
    name: 'payment_id',
    type: 'char',
    length: 26,
    nullable: true,
  })
  paymentId?: string | null;

  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'payment_id' })
  payment?: Payment | null;

  @Column({
    name: 'split_id',
    type: 'char',
    length: 26,
    nullable: true,
  })
  splitId?: string | null;

  @Column({
    name: 'reverses_entry_id',
    type: 'char',
    length: 26,
    nullable: true,
  })
  reversesEntryId?: string | null;

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
