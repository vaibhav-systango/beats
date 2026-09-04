import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { bigintTransformer } from './event.entity';
import { User } from './user.entity';

export enum WalletOwnerType {
  PLATFORM = 'PLATFORM',
  USER = 'USER',
}

@Entity('wallets')
export class Wallet {
  @PrimaryColumn({
    type: 'char',
    length: 26,
  })
  id: string;

  @Column({
    name: 'owner_type',
    type: 'enum',
    enum: WalletOwnerType,
  })
  ownerType: WalletOwnerType;

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
    name: 'balance_paise',
    type: 'bigint',
    default: 0,
    transformer: bigintTransformer,
  })
  balancePaise: number;

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
