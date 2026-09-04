import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ulid } from 'ulid';
import {
  PaymentSplit,
  PayoutStatus,
} from '../../../database/entities/payment-split.entity';
import {
  LedgerDirection,
  LedgerReason,
  WalletLedgerEntry,
} from '../../../database/entities/wallet-ledger-entry.entity';
import { Wallet } from '../../../database/entities/wallet.entity';
import { PaymentConstants } from '../constants/payments.constants';
import { WalletService } from './wallet.service';

@Injectable()
export class PayoutService {
  constructor(private readonly walletService: WalletService) {}

  async cancelScheduledForPayment(
    manager: EntityManager,
    paymentId: string,
  ): Promise<void> {
    const splits = await manager.find(PaymentSplit, {
      where: { paymentId, payoutStatus: PayoutStatus.SCHEDULED },
      lock: { mode: 'pessimistic_write' },
    });
    for (const split of splits) {
      split.payoutStatus = PayoutStatus.CANCELLED;
      await manager.save(PaymentSplit, split);
    }
  }

  async hasPaidPayout(
    manager: EntityManager,
    paymentId: string,
  ): Promise<boolean> {
    const paid = await manager.findOne(PaymentSplit, {
      where: { paymentId, payoutStatus: PayoutStatus.PAID },
    });
    return !!paid;
  }

  async settleScheduled(
    manager: EntityManager,
    batchSize = PaymentConstants.SETTLEMENT_BATCH_SIZE,
  ): Promise<{
    settlementBatchId: string;
    paidCount: number;
    paidAmountPaise: number;
  }> {
    const settlementBatchId = ulid();
    const limit = Math.max(1, Math.trunc(batchSize));
    const splits = await manager.find(PaymentSplit, {
      where: { payoutStatus: PayoutStatus.SCHEDULED },
      order: { createdAt: 'ASC' },
      take: limit,
      lock: { mode: 'pessimistic_write' },
    });

    let paidCount = 0;
    let paidAmountPaise = 0;

    for (const split of splits) {
      const existingSettlement = await manager.findOne(WalletLedgerEntry, {
        where: {
          walletId: split.walletId,
          paymentId: split.paymentId,
          splitId: split.id,
          reason: LedgerReason.PAYOUT_SETTLEMENT,
          direction: LedgerDirection.DEBIT,
        },
      });
      if (existingSettlement) {
        continue;
      }

      const wallet = await manager.findOne(Wallet, {
        where: { id: split.walletId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!wallet) {
        continue;
      }

      await this.walletService.debit(manager, wallet, {
        amountPaise: split.amountPaise,
        direction: LedgerDirection.DEBIT,
        reason: LedgerReason.PAYOUT_SETTLEMENT,
        paymentId: split.paymentId,
        splitId: split.id,
      });

      split.payoutStatus = PayoutStatus.PAID;
      split.settlementBatchId = settlementBatchId;
      split.settledAt = Date.now();
      await manager.save(PaymentSplit, split);
      paidCount += 1;
      paidAmountPaise += split.amountPaise;
    }

    return { settlementBatchId, paidCount, paidAmountPaise };
  }
}
