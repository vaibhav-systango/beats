import { Injectable } from '@nestjs/common';
import { EntityManager, IsNull } from 'typeorm';
import {
  Wallet,
  WalletOwnerType,
} from '../../../database/entities/wallet.entity';
import {
  LedgerDirection,
  LedgerReason,
  WalletLedgerEntry,
} from '../../../database/entities/wallet-ledger-entry.entity';
import { SplitRecipientType } from '../../../database/entities/payment-split.entity';
import { isUniqueViolation } from '../helpers/db-errors.helper';

export interface LedgerWriteInput {
  amountPaise: number;
  direction: LedgerDirection;
  reason: LedgerReason;
  paymentId?: string | null;
  splitId?: string | null;
  reversesEntryId?: string | null;
}

@Injectable()
export class WalletService {
  ownerTypeForRecipient(recipientType: SplitRecipientType): WalletOwnerType {
    return recipientType === SplitRecipientType.PLATFORM
      ? WalletOwnerType.PLATFORM
      : WalletOwnerType.USER;
  }

  async getOrCreate(
    manager: EntityManager,
    ownerType: WalletOwnerType,
    ownerUserId: string | null,
  ): Promise<Wallet> {
    const existing = await this.findForUpdate(manager, ownerType, ownerUserId);
    if (existing) {
      return existing;
    }

    const wallet = manager.create(Wallet, {
      ownerType,
      ownerUserId,
      balancePaise: 0,
    });

    try {
      return await manager.save(Wallet, wallet);
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
      const retry = await this.findForUpdate(manager, ownerType, ownerUserId);
      if (!retry) {
        throw error;
      }
      return retry;
    }
  }

  async credit(
    manager: EntityManager,
    wallet: Wallet,
    input: LedgerWriteInput,
  ): Promise<WalletLedgerEntry> {
    const locked = await manager.findOne(Wallet, {
      where: { id: wallet.id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!locked) {
      throw new Error(`Wallet ${wallet.id} not found`);
    }
    locked.balancePaise = Number(locked.balancePaise) + input.amountPaise;
    await manager.save(Wallet, locked);
    return manager.save(
      WalletLedgerEntry,
      manager.create(WalletLedgerEntry, {
        walletId: locked.id,
        amountPaise: input.amountPaise,
        direction: LedgerDirection.CREDIT,
        reason: input.reason,
        paymentId: input.paymentId ?? null,
        splitId: input.splitId ?? null,
        reversesEntryId: input.reversesEntryId ?? null,
      }),
    );
  }

  async debit(
    manager: EntityManager,
    wallet: Wallet,
    input: LedgerWriteInput,
  ): Promise<WalletLedgerEntry> {
    const locked = await manager.findOne(Wallet, {
      where: { id: wallet.id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!locked) {
      throw new Error(`Wallet ${wallet.id} not found`);
    }
    locked.balancePaise = Number(locked.balancePaise) - input.amountPaise;
    await manager.save(Wallet, locked);
    return manager.save(
      WalletLedgerEntry,
      manager.create(WalletLedgerEntry, {
        walletId: locked.id,
        amountPaise: input.amountPaise,
        direction: LedgerDirection.DEBIT,
        reason: input.reason,
        paymentId: input.paymentId ?? null,
        splitId: input.splitId ?? null,
        reversesEntryId: input.reversesEntryId ?? null,
      }),
    );
  }

  private findForUpdate(
    manager: EntityManager,
    ownerType: WalletOwnerType,
    ownerUserId: string | null,
  ): Promise<Wallet | null> {
    return manager.findOne(Wallet, {
      where: {
        ownerType,
        ownerUserId: ownerUserId ?? IsNull(),
      },
      lock: { mode: 'pessimistic_write' },
    });
  }
}
