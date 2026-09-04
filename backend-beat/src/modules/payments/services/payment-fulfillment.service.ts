import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager, In, IsNull } from 'typeorm';
import {
  IssuedTicket,
  IssuedTicketStatus,
} from '../../../database/entities/issued-ticket.entity';
import {
  Payment,
  PaymentStatus,
} from '../../../database/entities/payment.entity';
import {
  PaymentSplit,
  PayoutStatus,
} from '../../../database/entities/payment-split.entity';
import { SessionTicketType } from '../../../database/entities/session-ticket-type.entity';
import { Wallet } from '../../../database/entities/wallet.entity';
import {
  LedgerDirection,
  LedgerReason,
  WalletLedgerEntry,
} from '../../../database/entities/wallet-ledger-entry.entity';
import { isUniqueViolation } from '../helpers/db-errors.helper';
import {
  assertSplitsReconcile,
  calculatePaymentSplits,
} from '../helpers/payment-split.helper';
import { InventoryService } from './inventory.service';
import { PayoutService } from './payout.service';
import { WalletService } from './wallet.service';

@Injectable()
export class PaymentFulfillmentService {
  private readonly platformFeeBps: number;

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly walletService: WalletService,
    private readonly payoutService: PayoutService,
    configService: ConfigService,
  ) {
    this.platformFeeBps = Number(
      configService.get<number>('payment.platformFeeBps') ?? 0,
    );
  }

  async fulfillIfNeeded(
    manager: EntityManager,
    payment: Payment,
  ): Promise<void> {
    if (payment.status !== PaymentStatus.SUCCEEDED || payment.fulfilledAt) {
      return;
    }

    await this.issueTickets(manager, payment);
    await this.applySplits(manager, payment);

    payment.fulfilledAt = Date.now();
    await manager.save(Payment, payment);
  }

  async reverseFulfillment(
    manager: EntityManager,
    payment: Payment,
  ): Promise<void> {
    const tickets = await manager.find(IssuedTicket, {
      where: { paymentId: payment.id },
    });
    for (const ticket of tickets) {
      if (ticket.status === IssuedTicketStatus.VALID) {
        ticket.status = IssuedTicketStatus.VOID;
        await manager.save(IssuedTicket, ticket);
      }
    }

    await this.payoutService.cancelScheduledForPayment(manager, payment.id);
    await this.clawbackCredits(manager, payment);
    await this.inventoryService.releaseHoldForPayment(manager, payment);
  }

  private async issueTickets(
    manager: EntityManager,
    payment: Payment,
  ): Promise<void> {
    const existing = await manager.find(IssuedTicket, {
      where: { paymentId: payment.id },
    });
    if (existing.length > 0) {
      return;
    }

    const issued: IssuedTicket[] = [];
    for (const item of payment.metadata?.items ?? []) {
      for (let i = 0; i < item.quantity; i += 1) {
        issued.push(
          manager.create(IssuedTicket, {
            paymentId: payment.id,
            ticketTypeId: item.ticketTypeId,
            sessionId: item.sessionId,
            status: IssuedTicketStatus.VALID,
          }),
        );
      }
    }
    if (issued.length > 0) {
      try {
        await manager.save(IssuedTicket, issued);
      } catch (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }
      }
    }
  }

  private async applySplits(
    manager: EntityManager,
    payment: Payment,
  ): Promise<void> {
    const existing = await manager.find(PaymentSplit, {
      where: { paymentId: payment.id },
    });
    if (existing.length > 0) {
      return;
    }
    if (payment.amount === 0) {
      return;
    }

    const items = payment.metadata?.items ?? [];
    const ticketTypeIds = items.map((item) => item.ticketTypeId);
    const tickets = await manager.find(SessionTicketType, {
      where: { id: In(ticketTypeIds) },
      relations: { session: { event: true } },
    });
    const ticketById = new Map(tickets.map((ticket) => [ticket.id, ticket]));

    const lines = items.map((item) => {
      const ticket = ticketById.get(item.ticketTypeId);
      const session = ticket?.session;
      if (!ticket || !session?.event) {
        throw new Error(`Missing session data for ticket ${item.ticketTypeId}`);
      }
      return {
        amountPaise: item.unitPricePaise * item.quantity,
        organizerId: session.event.organizerId,
        allowReferral: !!session.allowReferral,
        referralPercent: Number(session.referralRewardPerTicket ?? 0),
        allowPromoters: !!session.allowPromoters,
        promoterPercent: Number(session.promoterCommissionPercentage ?? 0),
      };
    });

    const calculated = calculatePaymentSplits({
      lines,
      platformFeeBps: this.platformFeeBps,
      referrerUserId: payment.referrerUserId,
      promoterUserId: payment.promoterUserId,
    });
    assertSplitsReconcile(payment.amount, calculated);

    for (const split of calculated) {
      const wallet = await this.walletService.getOrCreate(
        manager,
        this.walletService.ownerTypeForRecipient(split.recipientType),
        split.ownerUserId,
      );
      const savedSplit = await manager.save(
        PaymentSplit,
        manager.create(PaymentSplit, {
          paymentId: payment.id,
          recipientType: split.recipientType,
          ownerUserId: split.ownerUserId,
          walletId: wallet.id,
          amountPaise: split.amountPaise,
          payoutStatus: PayoutStatus.SCHEDULED,
        }),
      );
      await this.walletService.credit(manager, wallet, {
        amountPaise: split.amountPaise,
        direction: LedgerDirection.CREDIT,
        reason: LedgerReason.PAYMENT_SPLIT,
        paymentId: payment.id,
        splitId: savedSplit.id,
      });
    }
  }

  private async clawbackCredits(
    manager: EntityManager,
    payment: Payment,
  ): Promise<void> {
    const credits = await manager.find(WalletLedgerEntry, {
      where: {
        paymentId: payment.id,
        reason: LedgerReason.PAYMENT_SPLIT,
        direction: LedgerDirection.CREDIT,
      },
    });

    for (const credit of credits) {
      const already = await manager.findOne(WalletLedgerEntry, {
        where: {
          walletId: credit.walletId,
          paymentId: payment.id,
          splitId: credit.splitId ?? IsNull(),
          reason: LedgerReason.REFUND_CLAWBACK,
          direction: LedgerDirection.DEBIT,
        },
      });
      if (already) {
        continue;
      }
      const wallet = await manager.findOne(Wallet, {
        where: { id: credit.walletId },
      });
      if (!wallet) {
        continue;
      }
      await this.walletService.debit(manager, wallet, {
        amountPaise: credit.amountPaise,
        direction: LedgerDirection.DEBIT,
        reason: LedgerReason.REFUND_CLAWBACK,
        paymentId: payment.id,
        splitId: credit.splitId,
        reversesEntryId: credit.id,
      });
    }
  }
}
